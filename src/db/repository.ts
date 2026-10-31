import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import {
  computeAssessment,
  type AssessmentItemResult,
  type AssessmentSummaryCounts,
  type CurrentRequirementInput,
  type HistoricalTestInput,
  type PublishedDatasetInput,
} from "../domain/assessment-engine";
import {
  validateDatasetForPublish,
  type DatasetPublishValidationResult,
} from "../domain/dataset-validation";
import {
  getLocalizedName,
  type ProductCategoryTranslationInput,
} from "../domain/product-category-translations";
import {
  assessments,
  auditEvents,
  certificateRevisionDocuments,
  certificateRevisions,
  certificateRevisionTests,
  certificates,
  documents,
  productCategories,
  productCategoryTranslations,
  regulations,
  regulationVersions,
  regulatoryDatasets,
  requirements,
  standards,
  standardVersions,
  tests,
} from "./schema";

export type ProductCategoryWithTranslations = {
  id: string;
  code: string;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  translations: ProductCategoryTranslationInput[];
};

export type AuditEventSummary = {
  id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  requestId: string;
  reason: string | null;
  createdAt: Date;
};

export type CertificateRevisionTestRecord = {
  id: string;
  certificateRevisionId: string;
  testId: string;
  testCode: string;
  testName: string;
  standardVersionId: string | null;
  standardCode: string | null;
  standardVersionLabel: string | null;
  standardClause: string | null;
  parameters: Record<string, unknown>;
  protocolNumber: string | null;
  sourcePageSection: string | null;
  createdAt: Date;
};

export type CertificateRecord = {
  id: string;
  certificateNumber: string;
  status: string;
  version: number;
  revisionId: string;
  revisionNumber: number;
  productCategoryId: string;
  productCategoryCode: string;
  productName: string;
  productModel: string | null;
  manufacturer: string;
  applicant: string | null;
  regulationCode: string;
  certificationScheme: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  confirmedAt: Date | null;
  confirmedByEmail: string | null;
  createdByEmail: string;
  createdAt: Date;
  tests: CertificateRevisionTestRecord[];
};

export type RegulationWithVersions = {
  id: string;
  code: string;
  name: string;
  status: string;
  version: number;
  versions: Array<{
    id: string;
    regulationId: string;
    versionLabel: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    status: string;
  }>;
};

export type StandardWithVersions = {
  id: string;
  code: string;
  name: string;
  status: string;
  version: number;
  versions: Array<{
    id: string;
    standardId: string;
    versionLabel: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    status: string;
  }>;
};

export type DatasetRequirementDetail = {
  id: string;
  datasetId: string;
  productCategoryId: string;
  productCategoryCode: string;
  regulationVersionId: string;
  regulationCode: string;
  regulationVersionLabel: string;
  provision: string;
  standardVersionId: string;
  standardCode: string;
  standardVersionLabel: string;
  standardClause: string;
  testId: string;
  testCode: string;
  testName: string;
  parameters: Record<string, unknown>;
  effectiveFrom: string;
  effectiveTo: string | null;
  sourceReference: string;
  sourcePageSection: string;
  extractionMethod: string;
  reviewStatus: string;
  reviewedByEmail: string | null;
  reviewedAt: Date | null;
  version: number;
};

export type RegulatoryDatasetDetail = {
  id: string;
  code: string;
  regulationId: string;
  regulationCode: string;
  title: string;
  datasetVersion: number;
  status: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  version: number;
  publishedAt: Date | null;
  publishedByEmail: string | null;
  supersededAt: Date | null;
  createdByEmail: string;
  createdAt: Date;
  requirements: DatasetRequirementDetail[];
};

export type AssessmentSummaryRecord = {
  id: string;
  certificateRevisionId: string;
  certificateNumber: string;
  revisionNumber: number;
  productName: string;
  productCategoryId: string;
  productCategoryCode: string;
  productCategoryVersion: number;
  regulatoryDatasetId: string | null;
  regulatoryDatasetCode: string | null;
  assessmentDate: string;
  overallStatus: string;
  summaryCounts: AssessmentSummaryCounts;
  results: AssessmentItemResult[];
  inputSnapshot: Record<string, unknown>;
  createdByEmail: string;
  createdAt: Date;
};

function groupCategoryRows(
  rows: Array<{
    category: typeof productCategories.$inferSelect;
    translation: typeof productCategoryTranslations.$inferSelect | null;
  }>,
) {
  const categories = new Map<string, ProductCategoryWithTranslations>();

  for (const row of rows) {
    const existing = categories.get(row.category.id);
    const category = existing ?? {
      ...row.category,
      translations: [],
    };

    if (row.translation) category.translations.push(row.translation);
    categories.set(row.category.id, category);
  }

  return [...categories.values()];
}

export async function listActiveProductCategories(connectionString: string) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);

    const categories = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.status, "active"))
      .orderBy(asc(productCategories.code))
      .limit(100);
    if (categories.length === 0) return [];

    const translations = await db
      .select()
      .from(productCategoryTranslations)
      .where(
        inArray(
          productCategoryTranslations.productCategoryId,
          categories.map((category) => category.id),
        ),
      )
      .orderBy(asc(productCategoryTranslations.locale));

    return categories.map((category) => ({
      ...category,
      translations: translations.filter(
        (translation) => translation.productCategoryId === category.id,
      ),
    }));
  } finally {
    await client.end();
  }
}

export async function getProductCategory(connectionString: string, id: string) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    const rows = await db
      .select()
      .from(productCategories)
      .leftJoin(
        productCategoryTranslations,
        eq(productCategories.id, productCategoryTranslations.productCategoryId),
      )
      .where(eq(productCategories.id, id))
      .orderBy(asc(productCategoryTranslations.locale));

    return (
      groupCategoryRows(
        rows.map((row) => ({
          category: row.product_categories,
          translation: row.product_category_translations,
        })),
      )[0] ?? null
    );
  } finally {
    await client.end();
  }
}

export async function createProductCategory(
  connectionString: string,
  input: {
    code: string;
    translations: ProductCategoryTranslationInput[];
    actorEmail: string;
    requestId: string;
    reason?: string | null;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const [category] = await tx
        .insert(productCategories)
        .values({ code: input.code })
        .returning();

      await tx.insert(productCategoryTranslations).values(
        input.translations.map((translation) => ({
          productCategoryId: category.id,
          ...translation,
        })),
      );

      const after = {
        ...category,
        translations: input.translations,
      };

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "create",
        entityType: "product_category",
        entityId: category.id,
        requestId: input.requestId,
        reason: input.reason ?? null,
        beforeJson: null,
        afterJson: after,
      });

      return after;
    });
  } finally {
    await client.end();
  }
}

export async function updateProductCategory(
  connectionString: string,
  input: {
    id: string;
    version: number;
    translations: ProductCategoryTranslationInput[];
    actorEmail: string;
    requestId: string;
    reason?: string | null;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);

    return await db.transaction(async (tx) => {
      const beforeRows = await tx
        .select()
        .from(productCategories)
        .leftJoin(
          productCategoryTranslations,
          eq(productCategories.id, productCategoryTranslations.productCategoryId),
        )
        .where(eq(productCategories.id, input.id))
        .orderBy(asc(productCategoryTranslations.locale));
      const before = groupCategoryRows(
        beforeRows.map((row) => ({
          category: row.product_categories,
          translation: row.product_category_translations,
        })),
      )[0];

      if (!before) return null;

      const updated = await tx
        .update(productCategories)
        .set({
          version: sql`${productCategories.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(productCategories.id, input.id),
            eq(productCategories.version, input.version),
          ),
        )
        .returning();

      if (!updated[0]) return null;

      await tx
        .delete(productCategoryTranslations)
        .where(eq(productCategoryTranslations.productCategoryId, input.id));

      await tx.insert(productCategoryTranslations).values(
        input.translations.map((translation) => ({
          productCategoryId: input.id,
          ...translation,
        })),
      );

      const after = {
        ...updated[0],
        translations: input.translations,
      };

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "update",
        entityType: "product_category",
        entityId: input.id,
        requestId: input.requestId,
        reason: input.reason ?? null,
        beforeJson: before,
        afterJson: after,
      });

      return after;
    });
  } finally {
    await client.end();
  }
}

export async function archiveProductCategory(
  connectionString: string,
  input: {
    id: string;
    version: number;
    actorEmail: string;
    requestId: string;
    reason?: string | null;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(productCategories)
        .where(eq(productCategories.id, input.id));
      if (!before) return null;

      const [updated] = await tx
        .update(productCategories)
        .set({
          status: "archived",
          version: sql`${productCategories.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(productCategories.id, input.id),
            eq(productCategories.version, input.version),
          ),
        )
        .returning();

      if (!updated) return null;

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "archive",
        entityType: "product_category",
        entityId: input.id,
        requestId: input.requestId,
        reason: input.reason ?? null,
        beforeJson: before,
        afterJson: updated,
      });

      return updated;
    });
  } finally {
    await client.end();
  }
}

export async function listRecentAuditEvents(connectionString: string, limit = 50) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);

    return await db
      .select({
        id: auditEvents.id,
        actorEmail: auditEvents.actorEmail,
        action: auditEvents.action,
        entityType: auditEvents.entityType,
        entityId: auditEvents.entityId,
        requestId: auditEvents.requestId,
        reason: auditEvents.reason,
        createdAt: auditEvents.createdAt,
      })
      .from(auditEvents)
      .orderBy(desc(auditEvents.createdAt))
      .limit(Math.min(Math.max(limit, 1), 100));
  } finally {
    await client.end();
  }
}

export async function listTests(connectionString: string) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db
      .select()
      .from(tests)
      .where(eq(tests.status, "active"))
      .orderBy(asc(tests.code))
      .limit(200);
  } finally {
    await client.end();
  }
}

export async function createTest(
  connectionString: string,
  input: {
    code: string;
    name: string;
    method?: string | null;
    unit?: string | null;
    defaultParameters?: Record<string, unknown>;
    actorEmail: string;
    requestId: string;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(tests)
        .values({
          code: input.code,
          name: input.name,
          method: input.method ?? null,
          unit: input.unit ?? null,
          defaultParametersJson: input.defaultParameters ?? {},
        })
        .returning();

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "create",
        entityType: "test",
        entityId: created.id,
        requestId: input.requestId,
        beforeJson: null,
        afterJson: created,
      });

      return created;
    });
  } finally {
    await client.end();
  }
}

export async function updateTest(
  connectionString: string,
  input: {
    id: string;
    version: number;
    name: string;
    method?: string | null;
    unit?: string | null;
    defaultParameters?: Record<string, unknown>;
    actorEmail: string;
    requestId: string;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const [before] = await tx.select().from(tests).where(eq(tests.id, input.id));
      if (!before) return null;

      const [updated] = await tx
        .update(tests)
        .set({
          name: input.name,
          method: input.method ?? null,
          unit: input.unit ?? null,
          defaultParametersJson: input.defaultParameters ?? before.defaultParametersJson,
          version: sql`${tests.version} + 1`,
          updatedAt: new Date(),
        })
        .where(and(eq(tests.id, input.id), eq(tests.version, input.version)))
        .returning();

      if (!updated) return null;

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "update",
        entityType: "test",
        entityId: input.id,
        requestId: input.requestId,
        beforeJson: before,
        afterJson: updated,
      });

      return updated;
    });
  } finally {
    await client.end();
  }
}

export async function archiveTest(
  connectionString: string,
  input: {
    id: string;
    version: number;
    actorEmail: string;
    requestId: string;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const [before] = await tx.select().from(tests).where(eq(tests.id, input.id));
      if (!before) return null;

      const [updated] = await tx
        .update(tests)
        .set({
          status: "archived",
          version: sql`${tests.version} + 1`,
          updatedAt: new Date(),
        })
        .where(and(eq(tests.id, input.id), eq(tests.version, input.version)))
        .returning();

      if (!updated) return null;

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "archive",
        entityType: "test",
        entityId: input.id,
        requestId: input.requestId,
        beforeJson: before,
        afterJson: updated,
      });

      return updated;
    });
  } finally {
    await client.end();
  }
}

export async function listRegulations(
  connectionString: string,
): Promise<RegulationWithVersions[]> {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    const regs = await db
      .select()
      .from(regulations)
      .where(eq(regulations.status, "active"))
      .orderBy(asc(regulations.code));

    if (regs.length === 0) return [];

    const versions = await db
      .select()
      .from(regulationVersions)
      .where(
        inArray(
          regulationVersions.regulationId,
          regs.map((r) => r.id),
        ),
      )
      .orderBy(desc(regulationVersions.effectiveFrom));

    return regs.map((reg) => ({
      id: reg.id,
      code: reg.code,
      name: reg.name,
      status: reg.status,
      version: reg.version,
      versions: versions
        .filter((v) => v.regulationId === reg.id)
        .map((v) => ({
          id: v.id,
          regulationId: v.regulationId,
          versionLabel: v.versionLabel,
          effectiveFrom: v.effectiveFrom,
          effectiveTo: v.effectiveTo,
          status: v.status,
        })),
    }));
  } finally {
    await client.end();
  }
}

export async function createRegulationWithVersion(
  connectionString: string,
  input: {
    code: string;
    name: string;
    versionLabel: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
    actorEmail: string;
    requestId: string;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const existingRegs = await tx
        .select()
        .from(regulations)
        .where(eq(regulations.code, input.code));

      const reg =
        existingRegs[0] ??
        (
          await tx
            .insert(regulations)
            .values({ code: input.code, name: input.name })
            .returning()
        )[0];

      const [version] = await tx
        .insert(regulationVersions)
        .values({
          regulationId: reg.id,
          versionLabel: input.versionLabel,
          effectiveFrom: input.effectiveFrom,
          effectiveTo: input.effectiveTo ?? null,
        })
        .returning();

      const after = { regulation: reg, version };

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "create",
        entityType: "regulation_version",
        entityId: version.id,
        requestId: input.requestId,
        beforeJson: null,
        afterJson: after,
      });

      return after;
    });
  } finally {
    await client.end();
  }
}

export async function listStandards(
  connectionString: string,
): Promise<StandardWithVersions[]> {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    const stds = await db
      .select()
      .from(standards)
      .where(eq(standards.status, "active"))
      .orderBy(asc(standards.code));

    if (stds.length === 0) return [];

    const versions = await db
      .select()
      .from(standardVersions)
      .where(
        inArray(
          standardVersions.standardId,
          stds.map((s) => s.id),
        ),
      )
      .orderBy(desc(standardVersions.effectiveFrom));

    return stds.map((std) => ({
      id: std.id,
      code: std.code,
      name: std.name,
      status: std.status,
      version: std.version,
      versions: versions
        .filter((v) => v.standardId === std.id)
        .map((v) => ({
          id: v.id,
          standardId: v.standardId,
          versionLabel: v.versionLabel,
          effectiveFrom: v.effectiveFrom,
          effectiveTo: v.effectiveTo,
          status: v.status,
        })),
    }));
  } finally {
    await client.end();
  }
}

export async function createStandardWithVersion(
  connectionString: string,
  input: {
    code: string;
    name: string;
    versionLabel: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
    actorEmail: string;
    requestId: string;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const existingStds = await tx
        .select()
        .from(standards)
        .where(eq(standards.code, input.code));

      const std =
        existingStds[0] ??
        (
          await tx
            .insert(standards)
            .values({ code: input.code, name: input.name })
            .returning()
        )[0];

      const [version] = await tx
        .insert(standardVersions)
        .values({
          standardId: std.id,
          versionLabel: input.versionLabel,
          effectiveFrom: input.effectiveFrom,
          effectiveTo: input.effectiveTo ?? null,
        })
        .returning();

      const after = { standard: std, version };

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "create",
        entityType: "standard_version",
        entityId: version.id,
        requestId: input.requestId,
        beforeJson: null,
        afterJson: after,
      });

      return after;
    });
  } finally {
    await client.end();
  }
}

export async function listCertificates(
  connectionString: string,
  limit = 100,
): Promise<CertificateRecord[]> {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);

    const rows = await db
      .select({
        id: certificates.id,
        certificateNumber: certificates.certificateNumber,
        status: certificates.status,
        version: certificates.version,
        revisionId: certificateRevisions.id,
        revisionNumber: certificateRevisions.revisionNumber,
        productCategoryId: certificateRevisions.productCategoryId,
        productCategoryCode: productCategories.code,
        productName: certificateRevisions.productName,
        productModel: certificateRevisions.productModel,
        manufacturer: certificateRevisions.manufacturer,
        applicant: certificateRevisions.applicant,
        regulationCode: certificateRevisions.regulationCode,
        certificationScheme: certificateRevisions.certificationScheme,
        issuedAt: certificateRevisions.issuedAt,
        expiresAt: certificateRevisions.expiresAt,
        confirmedAt: certificateRevisions.confirmedAt,
        confirmedByEmail: certificateRevisions.confirmedByEmail,
        createdByEmail: certificateRevisions.createdByEmail,
        createdAt: certificateRevisions.createdAt,
      })
      .from(certificates)
      .innerJoin(
        certificateRevisions,
        eq(certificates.id, certificateRevisions.certificateId),
      )
      .innerJoin(
        productCategories,
        eq(certificateRevisions.productCategoryId, productCategories.id),
      )
      .where(eq(certificates.status, "active"))
      .orderBy(
        desc(certificateRevisions.createdAt),
        desc(certificateRevisions.revisionNumber),
      )
      .limit(Math.min(Math.max(limit, 1), 100));

    if (rows.length === 0) return [];

    const revisionIds = rows.map((r) => r.revisionId);
    const revTests = await db
      .select({
        id: certificateRevisionTests.id,
        certificateRevisionId: certificateRevisionTests.certificateRevisionId,
        testId: certificateRevisionTests.testId,
        testCode: tests.code,
        testName: tests.name,
        standardVersionId: certificateRevisionTests.standardVersionId,
        standardCode: standards.code,
        standardVersionLabel: standardVersions.versionLabel,
        standardClause: certificateRevisionTests.standardClause,
        parameters: certificateRevisionTests.parametersJson,
        protocolNumber: certificateRevisionTests.protocolNumber,
        sourcePageSection: certificateRevisionTests.sourcePageSection,
        createdAt: certificateRevisionTests.createdAt,
      })
      .from(certificateRevisionTests)
      .innerJoin(tests, eq(certificateRevisionTests.testId, tests.id))
      .leftJoin(
        standardVersions,
        eq(certificateRevisionTests.standardVersionId, standardVersions.id),
      )
      .leftJoin(standards, eq(standardVersions.standardId, standards.id))
      .where(inArray(certificateRevisionTests.certificateRevisionId, revisionIds))
      .orderBy(asc(tests.code));

    return rows.map((row) => ({
      ...row,
      tests: revTests.filter((t) => t.certificateRevisionId === row.revisionId),
    }));
  } finally {
    await client.end();
  }
}

export async function createCertificate(
  connectionString: string,
  input: {
    certificateNumber: string;
    productCategoryId: string;
    productName: string;
    productModel?: string | null;
    manufacturer: string;
    applicant?: string | null;
    regulationCode: string;
    certificationScheme?: string | null;
    issuedAt?: string | null;
    expiresAt?: string | null;
    confirmed?: boolean;
    actorEmail: string;
    requestId: string;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);

    return await db.transaction(async (tx) => {
      const [certificate] = await tx
        .insert(certificates)
        .values({ certificateNumber: input.certificateNumber })
        .returning();

      const now = new Date();
      const [revision] = await tx
        .insert(certificateRevisions)
        .values({
          certificateId: certificate.id,
          revisionNumber: 1,
          productCategoryId: input.productCategoryId,
          productName: input.productName,
          productModel: input.productModel ?? null,
          manufacturer: input.manufacturer,
          applicant: input.applicant ?? null,
          regulationCode: input.regulationCode,
          certificationScheme: input.certificationScheme ?? null,
          issuedAt: input.issuedAt ?? null,
          expiresAt: input.expiresAt ?? null,
          confirmedAt: input.confirmed ? now : null,
          confirmedByEmail: input.confirmed ? input.actorEmail : null,
          createdByEmail: input.actorEmail,
        })
        .returning();

      const after = { certificate, revision };

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "create",
        entityType: "certificate",
        entityId: certificate.id,
        requestId: input.requestId,
        beforeJson: null,
        afterJson: after,
      });

      return after;
    });
  } finally {
    await client.end();
  }
}

export async function createCertificateRevision(
  connectionString: string,
  input: {
    certificateId: string;
    version: number;
    productCategoryId: string;
    productName: string;
    productModel?: string | null;
    manufacturer: string;
    applicant?: string | null;
    regulationCode: string;
    certificationScheme?: string | null;
    issuedAt?: string | null;
    expiresAt?: string | null;
    confirmed?: boolean;
    reason?: string | null;
    actorEmail: string;
    requestId: string;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const [beforeCert] = await tx
        .select()
        .from(certificates)
        .where(eq(certificates.id, input.certificateId));
      if (!beforeCert) return { status: "not_found" as const };

      const [updatedCert] = await tx
        .update(certificates)
        .set({
          version: sql`${certificates.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(certificates.id, input.certificateId),
            eq(certificates.version, input.version),
          ),
        )
        .returning();

      if (!updatedCert) {
        return { status: "conflict" as const, current: beforeCert };
      }

      const priorRevisions = await tx
        .select()
        .from(certificateRevisions)
        .where(eq(certificateRevisions.certificateId, input.certificateId))
        .orderBy(desc(certificateRevisions.revisionNumber))
        .limit(1);

      const nextRevisionNumber = (priorRevisions[0]?.revisionNumber ?? 0) + 1;
      const now = new Date();

      const [revision] = await tx
        .insert(certificateRevisions)
        .values({
          certificateId: input.certificateId,
          revisionNumber: nextRevisionNumber,
          productCategoryId: input.productCategoryId,
          productName: input.productName,
          productModel: input.productModel ?? null,
          manufacturer: input.manufacturer,
          applicant: input.applicant ?? null,
          regulationCode: input.regulationCode,
          certificationScheme: input.certificationScheme ?? null,
          issuedAt: input.issuedAt ?? null,
          expiresAt: input.expiresAt ?? null,
          confirmedAt: input.confirmed ? now : null,
          confirmedByEmail: input.confirmed ? input.actorEmail : null,
          createdByEmail: input.actorEmail,
        })
        .returning();

      // Copy prior test programme to new revision so historical tests are preserved unless changed
      if (priorRevisions[0]) {
        const priorTests = await tx
          .select()
          .from(certificateRevisionTests)
          .where(
            eq(certificateRevisionTests.certificateRevisionId, priorRevisions[0].id),
          );
        if (priorTests.length > 0) {
          await tx.insert(certificateRevisionTests).values(
            priorTests.map((t) => ({
              certificateRevisionId: revision.id,
              testId: t.testId,
              standardVersionId: t.standardVersionId,
              standardClause: t.standardClause,
              parametersJson: t.parametersJson,
              protocolNumber: t.protocolNumber,
              sourcePageSection: t.sourcePageSection,
            })),
          );
        }
      }

      const after = { certificate: updatedCert, revision };

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "revise",
        entityType: "certificate",
        entityId: input.certificateId,
        requestId: input.requestId,
        reason: input.reason ?? null,
        beforeJson: { certificate: beforeCert, revision: priorRevisions[0] ?? null },
        afterJson: after,
      });

      return { status: "ok" as const, data: after };
    });
  } finally {
    await client.end();
  }
}

export async function confirmCertificateRevision(
  connectionString: string,
  input: {
    certificateRevisionId: string;
    actorEmail: string;
    requestId: string;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(certificateRevisions)
        .where(eq(certificateRevisions.id, input.certificateRevisionId));
      if (!before) return null;

      if (before.confirmedAt) return before;

      const [updated] = await tx
        .update(certificateRevisions)
        .set({
          confirmedAt: new Date(),
          confirmedByEmail: input.actorEmail,
        })
        .where(eq(certificateRevisions.id, input.certificateRevisionId))
        .returning();

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "confirm",
        entityType: "certificate_revision",
        entityId: input.certificateRevisionId,
        requestId: input.requestId,
        beforeJson: before,
        afterJson: updated,
      });

      return updated;
    });
  } finally {
    await client.end();
  }
}

export async function archiveCertificate(
  connectionString: string,
  input: {
    id: string;
    version: number;
    actorEmail: string;
    requestId: string;
    reason?: string | null;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(certificates)
        .where(eq(certificates.id, input.id));
      if (!before) return null;

      const [updated] = await tx
        .update(certificates)
        .set({
          status: "archived",
          version: sql`${certificates.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(eq(certificates.id, input.id), eq(certificates.version, input.version)),
        )
        .returning();

      if (!updated) return null;

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "archive",
        entityType: "certificate",
        entityId: input.id,
        requestId: input.requestId,
        reason: input.reason ?? null,
        beforeJson: before,
        afterJson: updated,
      });

      return updated;
    });
  } finally {
    await client.end();
  }
}

export async function addTestToCertificateRevision(
  connectionString: string,
  input: {
    certificateRevisionId: string;
    testId: string;
    standardVersionId?: string | null;
    standardClause?: string | null;
    parameters?: Record<string, unknown>;
    protocolNumber?: string | null;
    sourcePageSection?: string | null;
    actorEmail: string;
    requestId: string;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(certificateRevisionTests)
        .values({
          certificateRevisionId: input.certificateRevisionId,
          testId: input.testId,
          standardVersionId: input.standardVersionId ?? null,
          standardClause: input.standardClause ?? null,
          parametersJson: input.parameters ?? {},
          protocolNumber: input.protocolNumber ?? null,
          sourcePageSection: input.sourcePageSection ?? null,
        })
        .returning();

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "add_test",
        entityType: "certificate_revision",
        entityId: input.certificateRevisionId,
        requestId: input.requestId,
        beforeJson: null,
        afterJson: created,
      });

      return created;
    });
  } finally {
    await client.end();
  }
}

export async function listDocumentsForCertificateRevision(
  connectionString: string,
  certificateRevisionId: string,
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);

    return await db
      .select({
        id: documents.id,
        storageKey: documents.storageKey,
        originalFilename: documents.originalFilename,
        contentType: documents.contentType,
        sizeBytes: documents.sizeBytes,
        sha256: documents.sha256,
        createdByEmail: documents.createdByEmail,
        createdAt: documents.createdAt,
      })
      .from(certificateRevisionDocuments)
      .innerJoin(documents, eq(certificateRevisionDocuments.documentId, documents.id))
      .where(
        eq(certificateRevisionDocuments.certificateRevisionId, certificateRevisionId),
      )
      .orderBy(desc(documents.createdAt));
  } finally {
    await client.end();
  }
}

export async function createCertificateRevisionDocument(
  connectionString: string,
  input: {
    certificateRevisionId: string;
    storageKey: string;
    originalFilename: string;
    contentType: string;
    sizeBytes: number | null;
    sha256: string;
    actorEmail: string;
    requestId: string;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);

    return await db.transaction(async (tx) => {
      const [document] = await tx
        .insert(documents)
        .values({
          storageKey: input.storageKey,
          originalFilename: input.originalFilename,
          contentType: input.contentType,
          sizeBytes: input.sizeBytes,
          sha256: input.sha256,
          createdByEmail: input.actorEmail,
        })
        .returning();

      await tx.insert(certificateRevisionDocuments).values({
        certificateRevisionId: input.certificateRevisionId,
        documentId: document.id,
      });

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "upload",
        entityType: "document",
        entityId: document.id,
        requestId: input.requestId,
        beforeJson: null,
        afterJson: {
          ...document,
          certificateRevisionId: input.certificateRevisionId,
        },
      });

      return document;
    });
  } finally {
    await client.end();
  }
}

export async function listRegulatoryDatasets(
  connectionString: string,
  options: { includeNonPublished: boolean },
): Promise<RegulatoryDatasetDetail[]> {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    const datasetRows = await db
      .select({
        dataset: regulatoryDatasets,
        regulationCode: regulations.code,
      })
      .from(regulatoryDatasets)
      .innerJoin(regulations, eq(regulatoryDatasets.regulationId, regulations.id))
      .where(
        options.includeNonPublished
          ? undefined
          : eq(regulatoryDatasets.status, "published"),
      )
      .orderBy(desc(regulatoryDatasets.createdAt));

    if (datasetRows.length === 0) return [];

    const datasetIds = datasetRows.map((d) => d.dataset.id);
    const reqRows = await db
      .select({
        req: requirements,
        productCategoryCode: productCategories.code,
        regulationCode: regulations.code,
        regulationVersionLabel: regulationVersions.versionLabel,
        standardCode: standards.code,
        standardVersionLabel: standardVersions.versionLabel,
        testCode: tests.code,
        testName: tests.name,
      })
      .from(requirements)
      .innerJoin(
        productCategories,
        eq(requirements.productCategoryId, productCategories.id),
      )
      .innerJoin(
        regulationVersions,
        eq(requirements.regulationVersionId, regulationVersions.id),
      )
      .innerJoin(regulations, eq(regulationVersions.regulationId, regulations.id))
      .innerJoin(
        standardVersions,
        eq(requirements.standardVersionId, standardVersions.id),
      )
      .innerJoin(standards, eq(standardVersions.standardId, standards.id))
      .innerJoin(tests, eq(requirements.testId, tests.id))
      .where(inArray(requirements.datasetId, datasetIds))
      .orderBy(asc(productCategories.code), asc(tests.code));

    return datasetRows.map(({ dataset, regulationCode }) => ({
      id: dataset.id,
      code: dataset.code,
      regulationId: dataset.regulationId,
      regulationCode,
      title: dataset.title,
      datasetVersion: dataset.datasetVersion,
      status: dataset.status,
      effectiveFrom: dataset.effectiveFrom,
      effectiveTo: dataset.effectiveTo,
      version: dataset.version,
      publishedAt: dataset.publishedAt,
      publishedByEmail: dataset.publishedByEmail,
      supersededAt: dataset.supersededAt,
      createdByEmail: dataset.createdByEmail,
      createdAt: dataset.createdAt,
      requirements: reqRows
        .filter((r) => r.req.datasetId === dataset.id)
        .map((r) => ({
          id: r.req.id,
          datasetId: r.req.datasetId,
          productCategoryId: r.req.productCategoryId,
          productCategoryCode: r.productCategoryCode,
          regulationVersionId: r.req.regulationVersionId,
          regulationCode: r.regulationCode,
          regulationVersionLabel: r.regulationVersionLabel,
          provision: r.req.provision,
          standardVersionId: r.req.standardVersionId,
          standardCode: r.standardCode,
          standardVersionLabel: r.standardVersionLabel,
          standardClause: r.req.standardClause,
          testId: r.req.testId,
          testCode: r.testCode,
          testName: r.testName,
          parameters: r.req.parametersJson ?? {},
          effectiveFrom: r.req.effectiveFrom,
          effectiveTo: r.req.effectiveTo,
          sourceReference: r.req.sourceReference,
          sourcePageSection: r.req.sourcePageSection,
          extractionMethod: r.req.extractionMethod,
          reviewStatus: r.req.reviewStatus,
          reviewedByEmail: r.req.reviewedByEmail,
          reviewedAt: r.req.reviewedAt,
          version: r.req.version,
        })),
    }));
  } finally {
    await client.end();
  }
}

export async function createRegulatoryDataset(
  connectionString: string,
  input: {
    code: string;
    regulationId: string;
    title: string;
    datasetVersion?: number;
    effectiveFrom: string;
    effectiveTo?: string | null;
    actorEmail: string;
    requestId: string;
    reason?: string | null;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(regulatoryDatasets)
        .values({
          code: input.code,
          regulationId: input.regulationId,
          title: input.title,
          datasetVersion: input.datasetVersion ?? 1,
          status: "draft",
          effectiveFrom: input.effectiveFrom,
          effectiveTo: input.effectiveTo ?? null,
          createdByEmail: input.actorEmail,
        })
        .returning();

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "create",
        entityType: "regulatory_dataset",
        entityId: created.id,
        requestId: input.requestId,
        reason: input.reason ?? null,
        beforeJson: null,
        afterJson: created,
      });

      return created;
    });
  } finally {
    await client.end();
  }
}

export async function addRequirementToDataset(
  connectionString: string,
  input: {
    datasetId: string;
    productCategoryId: string;
    regulationVersionId: string;
    provision: string;
    standardVersionId: string;
    standardClause: string;
    testId: string;
    parameters?: Record<string, unknown>;
    effectiveFrom: string;
    effectiveTo?: string | null;
    sourceDocumentId?: string | null;
    sourceReference: string;
    sourcePageSection: string;
    extractionMethod?: string;
    actorEmail: string;
    requestId: string;
    reason?: string | null;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const [dataset] = await tx
        .select()
        .from(regulatoryDatasets)
        .where(eq(regulatoryDatasets.id, input.datasetId));

      if (!dataset) return { status: "dataset_not_found" as const };
      if (dataset.status !== "draft" && dataset.status !== "review") {
        return { status: "dataset_immutable" as const, datasetStatus: dataset.status };
      }

      const [created] = await tx
        .insert(requirements)
        .values({
          datasetId: input.datasetId,
          productCategoryId: input.productCategoryId,
          regulationVersionId: input.regulationVersionId,
          provision: input.provision,
          standardVersionId: input.standardVersionId,
          standardClause: input.standardClause,
          testId: input.testId,
          parametersJson: input.parameters ?? {},
          effectiveFrom: input.effectiveFrom,
          effectiveTo: input.effectiveTo ?? null,
          sourceDocumentId: input.sourceDocumentId ?? null,
          sourceReference: input.sourceReference,
          sourcePageSection: input.sourcePageSection,
          extractionMethod: input.extractionMethod ?? "manual",
          reviewStatus: "pending_review",
        })
        .returning();

      await tx
        .update(regulatoryDatasets)
        .set({
          version: sql`${regulatoryDatasets.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(regulatoryDatasets.id, input.datasetId));

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "create",
        entityType: "requirement",
        entityId: created.id,
        requestId: input.requestId,
        reason: input.reason ?? null,
        beforeJson: null,
        afterJson: created,
      });

      return { status: "ok" as const, data: created };
    });
  } finally {
    await client.end();
  }
}

export async function reviewRequirement(
  connectionString: string,
  input: {
    requirementId: string;
    reviewStatus: "approved" | "rejected";
    reason: string;
    actorEmail: string;
    requestId: string;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(requirements)
        .where(eq(requirements.id, input.requirementId));

      if (!before) return { status: "not_found" as const };

      const [dataset] = await tx
        .select()
        .from(regulatoryDatasets)
        .where(eq(regulatoryDatasets.id, before.datasetId));

      if (!dataset || (dataset.status !== "draft" && dataset.status !== "review")) {
        return {
          status: "dataset_immutable" as const,
          datasetStatus: dataset?.status ?? "unknown",
        };
      }

      const [updated] = await tx
        .update(requirements)
        .set({
          reviewStatus: input.reviewStatus,
          reviewedByEmail: input.actorEmail,
          reviewedAt: new Date(),
          version: sql`${requirements.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(requirements.id, input.requirementId))
        .returning();

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: `review_${input.reviewStatus}`,
        entityType: "requirement",
        entityId: input.requirementId,
        requestId: input.requestId,
        reason: input.reason,
        beforeJson: before,
        afterJson: updated,
      });

      return { status: "ok" as const, data: updated };
    });
  } finally {
    await client.end();
  }
}

export async function publishRegulatoryDataset(
  connectionString: string,
  input: {
    datasetId: string;
    reason: string;
    actorEmail: string;
    requestId: string;
  },
): Promise<
  | { status: "not_found" }
  | { status: "validation_failed"; validation: DatasetPublishValidationResult }
  | {
      status: "ok";
      dataset: typeof regulatoryDatasets.$inferSelect;
      supersededIds: string[];
    }
> {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      // Lock the target dataset row
      const [dataset] = await tx
        .select()
        .from(regulatoryDatasets)
        .where(eq(regulatoryDatasets.id, input.datasetId))
        .for("update");

      if (!dataset) return { status: "not_found" as const };

      // Lock all datasets for the same regulation so two concurrent publish calls serialize
      await tx
        .select()
        .from(regulatoryDatasets)
        .where(eq(regulatoryDatasets.regulationId, dataset.regulationId))
        .for("update");

      const reqRows = await tx
        .select({
          id: requirements.id,
          productCategoryCode: productCategories.code,
          productCategoryStatus: productCategories.status,
          regulationCode: regulations.code,
          regulationStatus: regulations.status,
          regulationVersionLabel: regulationVersions.versionLabel,
          regulationVersionStatus: regulationVersions.status,
          provision: requirements.provision,
          standardCode: standards.code,
          standardStatus: standards.status,
          standardVersionLabel: standardVersions.versionLabel,
          standardVersionStatus: standardVersions.status,
          standardClause: requirements.standardClause,
          testCode: tests.code,
          testStatus: tests.status,
          effectiveFrom: requirements.effectiveFrom,
          effectiveTo: requirements.effectiveTo,
          sourceReference: requirements.sourceReference,
          sourcePageSection: requirements.sourcePageSection,
          reviewStatus: requirements.reviewStatus,
        })
        .from(requirements)
        .innerJoin(
          productCategories,
          eq(requirements.productCategoryId, productCategories.id),
        )
        .innerJoin(
          regulationVersions,
          eq(requirements.regulationVersionId, regulationVersions.id),
        )
        .innerJoin(regulations, eq(regulationVersions.regulationId, regulations.id))
        .innerJoin(
          standardVersions,
          eq(requirements.standardVersionId, standardVersions.id),
        )
        .innerJoin(standards, eq(standardVersions.standardId, standards.id))
        .innerJoin(tests, eq(requirements.testId, tests.id))
        .where(eq(requirements.datasetId, dataset.id));

      const validation = validateDatasetForPublish({
        id: dataset.id,
        code: dataset.code,
        status: dataset.status,
        effectiveFrom: dataset.effectiveFrom,
        effectiveTo: dataset.effectiveTo,
        reason: input.reason,
        requirements: reqRows,
      });

      if (!validation.valid) {
        return { status: "validation_failed" as const, validation };
      }

      const now = new Date();
      const superseded = await tx
        .update(regulatoryDatasets)
        .set({
          status: "superseded",
          supersededAt: now,
          version: sql`${regulatoryDatasets.version} + 1`,
          updatedAt: now,
        })
        .where(
          and(
            eq(regulatoryDatasets.regulationId, dataset.regulationId),
            eq(regulatoryDatasets.status, "published"),
          ),
        )
        .returning();

      const [published] = await tx
        .update(regulatoryDatasets)
        .set({
          status: "published",
          publishedAt: now,
          publishedByEmail: input.actorEmail,
          version: sql`${regulatoryDatasets.version} + 1`,
          updatedAt: now,
        })
        .where(eq(regulatoryDatasets.id, dataset.id))
        .returning();

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "publish",
        entityType: "regulatory_dataset",
        entityId: dataset.id,
        requestId: input.requestId,
        reason: input.reason.trim(),
        beforeJson: {
          dataset,
          previouslyPublishedIds: superseded.map((s) => s.id),
        },
        afterJson: {
          dataset: published,
          supersededIds: superseded.map((s) => s.id),
        },
      });

      return {
        status: "ok" as const,
        dataset: published,
        supersededIds: superseded.map((s) => s.id),
      };
    });
  } finally {
    await client.end();
  }
}

export async function runAssessment(
  connectionString: string,
  input: {
    certificateRevisionId: string;
    assessmentDate: string;
    actorEmail: string;
    requestId: string;
  },
): Promise<
  { status: "revision_not_found" } | { status: "ok"; data: AssessmentSummaryRecord }
> {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    return await db.transaction(async (tx) => {
      const revRows = await tx
        .select({
          revision: certificateRevisions,
          certificateNumber: certificates.certificateNumber,
          category: productCategories,
        })
        .from(certificateRevisions)
        .innerJoin(certificates, eq(certificateRevisions.certificateId, certificates.id))
        .innerJoin(
          productCategories,
          eq(certificateRevisions.productCategoryId, productCategories.id),
        )
        .where(eq(certificateRevisions.id, input.certificateRevisionId));

      const revRow = revRows[0];
      if (!revRow) return { status: "revision_not_found" as const };

      const catTranslations = await tx
        .select()
        .from(productCategoryTranslations)
        .where(eq(productCategoryTranslations.productCategoryId, revRow.category.id));

      const categoryName =
        getLocalizedName(catTranslations, "en") ?? revRow.category.code;

      const histTestRows = await tx
        .select({
          id: certificateRevisionTests.id,
          testId: tests.id,
          testCode: tests.code,
          testName: tests.name,
          standardVersionId: certificateRevisionTests.standardVersionId,
          standardCode: standards.code,
          standardVersionLabel: standardVersions.versionLabel,
          standardClause: certificateRevisionTests.standardClause,
          parameters: certificateRevisionTests.parametersJson,
          protocolNumber: certificateRevisionTests.protocolNumber,
          sourcePageSection: certificateRevisionTests.sourcePageSection,
        })
        .from(certificateRevisionTests)
        .innerJoin(tests, eq(certificateRevisionTests.testId, tests.id))
        .leftJoin(
          standardVersions,
          eq(certificateRevisionTests.standardVersionId, standardVersions.id),
        )
        .leftJoin(standards, eq(standardVersions.standardId, standards.id))
        .where(
          eq(certificateRevisionTests.certificateRevisionId, input.certificateRevisionId),
        );

      const historicalTests: HistoricalTestInput[] = histTestRows.map((h) => ({
        id: h.id,
        testId: h.testId,
        testCode: h.testCode,
        testName: h.testName,
        standardVersionId: h.standardVersionId,
        standardCode: h.standardCode,
        standardVersionLabel: h.standardVersionLabel,
        standardClause: h.standardClause,
        parameters: h.parameters ?? {},
        protocolNumber: h.protocolNumber,
        sourcePageSection: h.sourcePageSection,
      }));

      // Retrieve published datasets
      const pubDatasetsRows = await tx
        .select({
          dataset: regulatoryDatasets,
          regulationCode: regulations.code,
        })
        .from(regulatoryDatasets)
        .innerJoin(regulations, eq(regulatoryDatasets.regulationId, regulations.id))
        .where(eq(regulatoryDatasets.status, "published"));

      const pubDatasetIds = pubDatasetsRows.map((d) => d.dataset.id);
      const reqRows =
        pubDatasetIds.length > 0
          ? await tx
              .select({
                req: requirements,
                productCategoryCode: productCategories.code,
                regulationCode: regulations.code,
                regulationVersionLabel: regulationVersions.versionLabel,
                regulationEffectiveFrom: regulationVersions.effectiveFrom,
                regulationEffectiveTo: regulationVersions.effectiveTo,
                standardCode: standards.code,
                standardVersionLabel: standardVersions.versionLabel,
                standardEffectiveFrom: standardVersions.effectiveFrom,
                standardEffectiveTo: standardVersions.effectiveTo,
                testCode: tests.code,
                testName: tests.name,
                testStatus: tests.status,
              })
              .from(requirements)
              .innerJoin(
                productCategories,
                eq(requirements.productCategoryId, productCategories.id),
              )
              .innerJoin(
                regulationVersions,
                eq(requirements.regulationVersionId, regulationVersions.id),
              )
              .innerJoin(regulations, eq(regulationVersions.regulationId, regulations.id))
              .innerJoin(
                standardVersions,
                eq(requirements.standardVersionId, standardVersions.id),
              )
              .innerJoin(standards, eq(standardVersions.standardId, standards.id))
              .innerJoin(tests, eq(requirements.testId, tests.id))
              .where(inArray(requirements.datasetId, pubDatasetIds))
          : [];

      const publishedDatasets: PublishedDatasetInput[] = pubDatasetsRows.map(
        ({ dataset, regulationCode }) => {
          const dsReqs: CurrentRequirementInput[] = reqRows
            .filter((r) => r.req.datasetId === dataset.id)
            .map((r) => ({
              id: r.req.id,
              productCategoryId: r.req.productCategoryId,
              productCategoryCode: r.productCategoryCode,
              productCategoryName:
                r.req.productCategoryId === revRow.category.id
                  ? categoryName
                  : r.productCategoryCode,
              regulationCode: r.regulationCode,
              regulationVersionId: r.req.regulationVersionId,
              regulationVersionLabel: r.regulationVersionLabel,
              regulationEffectiveFrom: r.regulationEffectiveFrom,
              regulationEffectiveTo: r.regulationEffectiveTo,
              provision: r.req.provision,
              standardCode: r.standardCode,
              standardVersionId: r.req.standardVersionId,
              standardVersionLabel: r.standardVersionLabel,
              standardEffectiveFrom: r.standardEffectiveFrom,
              standardEffectiveTo: r.standardEffectiveTo,
              standardClause: r.req.standardClause,
              testId: r.req.testId,
              testCode: r.testCode,
              testName: r.testName,
              testStatus: r.testStatus,
              parameters: r.req.parametersJson ?? {},
              effectiveFrom: r.req.effectiveFrom,
              effectiveTo: r.req.effectiveTo,
              sourceReference: r.req.sourceReference,
              sourcePageSection: r.req.sourcePageSection,
              extractionMethod: r.req.extractionMethod,
              reviewStatus: r.req.reviewStatus,
            }));

          return {
            id: dataset.id,
            code: dataset.code,
            title: dataset.title,
            regulationCode,
            datasetVersion: dataset.datasetVersion,
            status: dataset.status,
            effectiveFrom: dataset.effectiveFrom,
            effectiveTo: dataset.effectiveTo,
            publishedAt: dataset.publishedAt ? dataset.publishedAt.toISOString() : null,
            requirements: dsReqs,
          };
        },
      );

      const certificateInput = {
        certificateId: revRow.revision.certificateId,
        certificateNumber: revRow.certificateNumber,
        certificateRevisionId: revRow.revision.id,
        revisionNumber: revRow.revision.revisionNumber,
        confirmedAt: revRow.revision.confirmedAt
          ? revRow.revision.confirmedAt.toISOString()
          : null,
        productCategoryId: revRow.category.id,
        productCategoryCode: revRow.category.code,
        productCategoryName: categoryName,
        productCategoryStatus: revRow.category.status,
        productCategoryVersion: revRow.category.version,
        productName: revRow.revision.productName,
        manufacturer: revRow.revision.manufacturer,
        regulationCode: revRow.revision.regulationCode,
        historicalTests,
      };

      const computed = computeAssessment({
        assessmentDate: input.assessmentDate,
        certificate: certificateInput,
        publishedDatasets,
      });

      const inputSnapshot = {
        certificate: certificateInput,
        selectedDatasetId: computed.selectedDatasetId,
        selectedDatasetCode: computed.selectedDatasetCode,
        selectedDatasetVersion: computed.selectedDatasetVersion,
      };

      const [saved] = await tx
        .insert(assessments)
        .values({
          certificateRevisionId: revRow.revision.id,
          productCategoryId: revRow.category.id,
          productCategoryVersion: revRow.category.version,
          regulatoryDatasetId: computed.selectedDatasetId,
          assessmentDate: input.assessmentDate,
          overallStatus: computed.overallStatus,
          summaryCountsJson: computed.summaryCounts,
          inputSnapshotJson: inputSnapshot,
          resultsSnapshotJson: computed.results,
          createdByEmail: input.actorEmail,
        })
        .returning();

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "run_assessment",
        entityType: "assessment",
        entityId: saved.id,
        requestId: input.requestId,
        beforeJson: null,
        afterJson: {
          id: saved.id,
          certificateRevisionId: saved.certificateRevisionId,
          regulatoryDatasetId: saved.regulatoryDatasetId,
          assessmentDate: saved.assessmentDate,
          overallStatus: saved.overallStatus,
          summaryCounts: computed.summaryCounts,
        },
      });

      return {
        status: "ok" as const,
        data: {
          id: saved.id,
          certificateRevisionId: saved.certificateRevisionId,
          certificateNumber: revRow.certificateNumber,
          revisionNumber: revRow.revision.revisionNumber,
          productName: revRow.revision.productName,
          productCategoryId: saved.productCategoryId,
          productCategoryCode: revRow.category.code,
          productCategoryVersion: saved.productCategoryVersion,
          regulatoryDatasetId: saved.regulatoryDatasetId,
          regulatoryDatasetCode: computed.selectedDatasetCode,
          assessmentDate: saved.assessmentDate,
          overallStatus: saved.overallStatus,
          summaryCounts: computed.summaryCounts,
          results: computed.results,
          inputSnapshot,
          createdByEmail: saved.createdByEmail,
          createdAt: saved.createdAt,
        },
      };
    });
  } finally {
    await client.end();
  }
}

export async function listAssessments(
  connectionString: string,
  limit = 50,
): Promise<AssessmentSummaryRecord[]> {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    const rows = await db
      .select()
      .from(assessments)
      .orderBy(desc(assessments.createdAt))
      .limit(Math.min(Math.max(limit, 1), 100));

    return rows.map((row) => {
      const inputSnap = (row.inputSnapshotJson ?? {}) as {
        certificate?: {
          certificateNumber?: string;
          revisionNumber?: number;
          productName?: string;
          productCategoryCode?: string;
        };
        selectedDatasetCode?: string | null;
      };

      return {
        id: row.id,
        certificateRevisionId: row.certificateRevisionId,
        certificateNumber: inputSnap.certificate?.certificateNumber ?? "Unknown",
        revisionNumber: inputSnap.certificate?.revisionNumber ?? 1,
        productName: inputSnap.certificate?.productName ?? "Unknown",
        productCategoryId: row.productCategoryId,
        productCategoryCode: inputSnap.certificate?.productCategoryCode ?? "unknown",
        productCategoryVersion: row.productCategoryVersion,
        regulatoryDatasetId: row.regulatoryDatasetId,
        regulatoryDatasetCode: inputSnap.selectedDatasetCode ?? null,
        assessmentDate: row.assessmentDate,
        overallStatus: row.overallStatus,
        summaryCounts: row.summaryCountsJson as AssessmentSummaryCounts,
        results: row.resultsSnapshotJson as AssessmentItemResult[],
        inputSnapshot: (row.inputSnapshotJson ?? {}) as Record<string, unknown>,
        createdByEmail: row.createdByEmail,
        createdAt: row.createdAt,
      };
    });
  } finally {
    await client.end();
  }
}
