import "dotenv/config";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runMigrations } from "../../src/db/migrate";
import {
  addRequirementToDataset,
  createRegulatoryDataset,
  listActiveProductCategories,
  listAssessments,
  listCertificates,
  listRecentAuditEvents,
  listRegulatoryDatasets,
  publishRegulatoryDataset,
  reviewRequirement,
  runAssessment,
  updateProductCategory,
} from "../../src/db/repository";
import { seedDatabase } from "../../src/db/seed";

const baseDatabaseUrl = process.env.DATABASE_URL;
const tempDbName = `certified_loco_test_${Date.now()}`;

function withDatabaseName(url: string, dbName: string) {
  const parsed = new URL(url);
  parsed.pathname = `/${dbName}`;
  return parsed.toString();
}

describe.skipIf(!baseDatabaseUrl)("v1 PostgreSQL integration workflow", () => {
  const testConnectionString = baseDatabaseUrl
    ? withDatabaseName(baseDatabaseUrl, tempDbName)
    : "";

  beforeAll(async () => {
    const adminClient = new Client({ connectionString: baseDatabaseUrl });
    await adminClient.connect();
    try {
      await adminClient.query(`CREATE DATABASE "${tempDbName}"`);
    } finally {
      await adminClient.end();
    }

    await runMigrations(testConnectionString);
    await seedDatabase(testConnectionString);
  });

  afterAll(async () => {
    if (!baseDatabaseUrl) return;
    const adminClient = new Client({ connectionString: baseDatabaseUrl });
    await adminClient.connect();
    try {
      await adminClient.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [tempDbName],
      );
      await adminClient.query(`DROP DATABASE IF EXISTS "${tempDbName}"`);
    } finally {
      await adminClient.end();
    }
  });

  it("enforces optimistic concurrency on product categories and writes audit events", async () => {
    const categories = await listActiveProductCategories(testConnectionString);
    expect(categories.length).toBe(2);

    const target = categories[0];
    const updated = await updateProductCategory(testConnectionString, {
      id: target.id,
      version: target.version,
      translations: [
        {
          locale: "en",
          name: "Locomotive Wheelsets Updated",
          description: "Updated in integration test",
        },
        {
          locale: "ru",
          name: "Колесные пары локомотивов",
          description: null,
        },
        {
          locale: "kk",
          name: "Локомотивтердің дөңгелек жұптары",
          description: null,
        },
      ],
      actorEmail: "admin@test.local",
      requestId: "req-cat-1",
      reason: "Test category update",
    });

    expect(updated).not.toBeNull();
    expect(updated?.version).toBe(target.version + 1);

    // Concurrent edit with stale version must return null (conflict)
    const staleAttempt = await updateProductCategory(testConnectionString, {
      id: target.id,
      version: target.version,
      translations: [{ locale: "en", name: "Stale overwrite", description: null }],
      actorEmail: "admin2@test.local",
      requestId: "req-cat-stale",
    });
    expect(staleAttempt).toBeNull();
  });

  it("validates requirement approval before publishing, transitions draft -> published -> superseded, and preserves immutable assessment snapshots", async () => {
    const datasets = await listRegulatoryDatasets(testConnectionString, {
      includeNonPublished: true,
    });
    expect(datasets.length).toBe(1);
    const draftDataset = datasets[0];
    expect(draftDataset.status).toBe("draft");

    // Non-admin users cannot see unpublished datasets
    const userVisibleBefore = await listRegulatoryDatasets(testConnectionString, {
      includeNonPublished: false,
    });
    expect(userVisibleBefore).toEqual([]);

    // Publishing before approving requirements must fail validation
    const prematurePublish = await publishRegulatoryDataset(testConnectionString, {
      datasetId: draftDataset.id,
      reason: "Premature publish attempt",
      actorEmail: "admin@test.local",
      requestId: "req-pub-fail",
    });
    expect(prematurePublish.status).toBe("validation_failed");

    // Approve all requirements in the draft dataset
    for (const req of draftDataset.requirements) {
      const reviewed = await reviewRequirement(testConnectionString, {
        requirementId: req.id,
        reviewStatus: "approved",
        reason: "Verified against official source",
        actorEmail: "admin@test.local",
        requestId: `req-rev-${req.id}`,
      });
      expect(reviewed.status).toBe("ok");
    }

    // Publish the dataset
    const publishResult = await publishRegulatoryDataset(testConnectionString, {
      datasetId: draftDataset.id,
      reason: "Initial v1 regulatory dataset release",
      actorEmail: "admin@test.local",
      requestId: "req-pub-ok",
    });
    expect(publishResult.status).toBe("ok");

    // Published dataset cannot be edited in place
    const editPublishedAttempt = await reviewRequirement(testConnectionString, {
      requirementId: draftDataset.requirements[0].id,
      reviewStatus: "rejected",
      reason: "Attempt to mutate published requirement",
      actorEmail: "admin@test.local",
      requestId: "req-mutate-published",
    });
    expect(editPublishedAttempt.status).toBe("dataset_immutable");

    // Run deterministic assessment on seeded certificate revision
    const certs = await listCertificates(testConnectionString);
    expect(certs.length).toBe(1);
    const cert = certs[0];

    const assessmentRun = await runAssessment(testConnectionString, {
      certificateRevisionId: cert.revisionId,
      assessmentDate: "2026-10-31",
      actorEmail: "user@test.local",
      requestId: "req-assess-1",
    });
    expect(assessmentRun.status).toBe("ok");
    if (assessmentRun.status !== "ok") throw new Error("Assessment failed");

    const initialSnapshot = assessmentRun.data;
    expect(initialSnapshot.overallStatus).toBe("ready");
    expect(initialSnapshot.summaryCounts).toEqual({
      required: 1,
      additional: 1,
      changed: 1,
      historical_only: 1,
      review: 0,
    });

    // Create and publish a second dataset v2 that supersedes v1
    const secondDataset = await createRegulatoryDataset(testConnectionString, {
      code: "tr-ts-001-2011-wheelsets-v2",
      regulationId: draftDataset.regulationId,
      title: "ТР ТС 001/2011 — Wheelsets Dataset v2",
      datasetVersion: 2,
      effectiveFrom: "2026-01-01",
      actorEmail: "admin@test.local",
      requestId: "req-ds-2",
    });

    const firstReq = draftDataset.requirements[0];
    const addedReq = await addRequirementToDataset(testConnectionString, {
      datasetId: secondDataset.id,
      productCategoryId: firstReq.productCategoryId,
      regulationVersionId: firstReq.regulationVersionId,
      provision: firstReq.provision,
      standardVersionId: firstReq.standardVersionId,
      standardClause: firstReq.standardClause,
      testId: firstReq.testId,
      parameters: firstReq.parameters,
      effectiveFrom: "2026-01-01",
      sourceReference: firstReq.sourceReference,
      sourcePageSection: firstReq.sourcePageSection,
      actorEmail: "admin@test.local",
      requestId: "req-add-v2",
    });
    expect(addedReq.status).toBe("ok");
    if (addedReq.status !== "ok") throw new Error("Failed to add requirement");

    await reviewRequirement(testConnectionString, {
      requirementId: addedReq.data.id,
      reviewStatus: "approved",
      reason: "Approved for v2",
      actorEmail: "admin@test.local",
      requestId: "req-rev-v2",
    });

    const secondPublish = await publishRegulatoryDataset(testConnectionString, {
      datasetId: secondDataset.id,
      reason: "Publish v2 superseding v1",
      actorEmail: "admin@test.local",
      requestId: "req-pub-v2",
    });
    expect(secondPublish.status).toBe("ok");
    if (secondPublish.status === "ok") {
      expect(secondPublish.supersededIds).toContain(draftDataset.id);
    }

    // Verify completed assessment snapshot did NOT change after v2 was published
    const persistedAssessments = await listAssessments(testConnectionString);
    const reloadedAssessment = persistedAssessments.find(
      (a) => a.id === initialSnapshot.id,
    );
    expect(reloadedAssessment).toBeDefined();
    expect(reloadedAssessment?.regulatoryDatasetId).toBe(draftDataset.id);
    expect(reloadedAssessment?.summaryCounts).toEqual(initialSnapshot.summaryCounts);
    expect(reloadedAssessment?.results).toEqual(initialSnapshot.results);

    // Verify audit history captured material changes
    const audits = await listRecentAuditEvents(testConnectionString);
    expect(audits.length).toBeGreaterThanOrEqual(5);
  });
});
