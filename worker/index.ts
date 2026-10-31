import {
  addRequirementToDataset,
  addTestToCertificateRevision,
  archiveCertificate,
  archiveProductCategory,
  archiveTest,
  confirmCertificateRevision,
  createCertificate,
  createCertificateRevision,
  createCertificateRevisionDocument,
  createProductCategory,
  createRegulationWithVersion,
  createRegulatoryDataset,
  createStandardWithVersion,
  createTest,
  getProductCategory,
  listActiveProductCategories,
  listAssessments,
  listCertificates,
  listDocumentsForCertificateRevision,
  listRecentAuditEvents,
  listRegulations,
  listRegulatoryDatasets,
  listStandards,
  listTests,
  publishRegulatoryDataset,
  reviewRequirement,
  runAssessment,
  updateProductCategory,
  updateTest,
} from "../src/db/repository";
import { parseProductCategoryTranslations } from "../src/domain/product-category-translations";
import { authenticateRequest } from "../src/infrastructure/auth/cloudflare-access";

export interface Env {
  DATABASE_URL?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUDIENCE?: string;
  ADMIN_EMAILS?: string;
  DOCUMENTS?: R2Bucket;
  HYPERDRIVE?: {
    connectionString: string;
  };
}

function getConnectionString(env: Env) {
  return env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;
}

function readText(body: Record<string, unknown>, key: string, required = false) {
  const value = typeof body[key] === "string" ? body[key].trim() : "";
  return required && !value ? null : value || null;
}

function readDate(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return value;
}

function readObject(body: Record<string, unknown>, key: string): Record<string, unknown> {
  const val = body[key];
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return {};
}

function toHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "document.pdf";
}

function getRequestId(request: Request) {
  return request.headers.get("X-Request-ID") ?? crypto.randomUUID();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        service: "certified-loco-api",
      });
    }

    if (!url.pathname.startsWith("/api/")) {
      return new Response("Not found", { status: 404 });
    }

    const user = await authenticateRequest(request, env);
    if (!user) {
      return Response.json(
        { error: "authentication_required" },
        { status: 401, headers: { "WWW-Authenticate": "Cloudflare Access" } },
      );
    }

    if (url.pathname === "/api/me") {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
      }
      return Response.json({ data: user });
    }

    const connectionString = getConnectionString(env);
    if (!connectionString) {
      return Response.json(
        {
          error: "database_not_configured",
          message:
            "Configure DATABASE_URL locally or the HYPERDRIVE binding when deployed.",
        },
        { status: 503 },
      );
    }

    // Document uploads & listings on certificate revisions
    const documentMatch = url.pathname.match(
      /^\/api\/certificate-revisions\/([^/]+)\/documents$/,
    );
    if (documentMatch) {
      if (request.method !== "GET" && user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }

      const certificateRevisionId = decodeURIComponent(documentMatch[1]);

      if (request.method === "GET") {
        try {
          const documents = await listDocumentsForCertificateRevision(
            connectionString,
            certificateRevisionId,
          );
          return Response.json({ data: documents });
        } catch (error) {
          console.error("Failed to read certificate documents", error);
          return Response.json({ error: "documents_unavailable" }, { status: 503 });
        }
      }

      if (request.method !== "POST")
        return new Response("Method not allowed", { status: 405 });
      if (!env.DOCUMENTS) {
        return Response.json(
          { error: "document_storage_not_configured" },
          { status: 503 },
        );
      }

      const contentType = request.headers.get("Content-Type")?.split(";", 1)[0];
      const originalFilename = request.headers.get("X-File-Name")?.trim();
      if (contentType !== "application/pdf" || !originalFilename) {
        return Response.json({ error: "pdf_and_file_name_required" }, { status: 400 });
      }

      const bytes = await request.arrayBuffer();
      if (bytes.byteLength === 0 || bytes.byteLength > 10 * 1024 * 1024) {
        return Response.json(
          {
            error: "document_size_invalid",
            message: "PDF must be between 1 byte and 10 MB.",
          },
          { status: 400 },
        );
      }

      const storageKey = `certificate-revisions/${certificateRevisionId}/${crypto.randomUUID()}-${safeFilename(originalFilename)}`;
      const sha256 = toHex(await crypto.subtle.digest("SHA-256", bytes));

      await env.DOCUMENTS.put(storageKey, bytes, {
        httpMetadata: { contentType },
      });

      try {
        const document = await createCertificateRevisionDocument(connectionString, {
          certificateRevisionId,
          storageKey,
          originalFilename,
          contentType,
          sizeBytes: bytes.byteLength,
          sha256,
          actorEmail: user.email,
          requestId: getRequestId(request),
        });

        return Response.json({ data: document }, { status: 201 });
      } catch (error) {
        await env.DOCUMENTS.delete(storageKey);
        if (
          typeof error === "object" &&
          error &&
          "code" in error &&
          error.code === "23503"
        ) {
          return Response.json(
            { error: "certificate_revision_not_found" },
            { status: 404 },
          );
        }

        console.error("Failed to save certificate document metadata", error);
        return Response.json({ error: "document_unavailable" }, { status: 503 });
      }
    }

    // Confirm certificate revision
    const confirmRevisionMatch = url.pathname.match(
      /^\/api\/certificate-revisions\/([^/]+)\/confirm$/,
    );
    if (confirmRevisionMatch) {
      if (user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      try {
        const confirmed = await confirmCertificateRevision(connectionString, {
          certificateRevisionId: decodeURIComponent(confirmRevisionMatch[1]),
          actorEmail: user.email,
          requestId: getRequestId(request),
        });
        if (!confirmed) {
          return Response.json(
            { error: "certificate_revision_not_found" },
            { status: 404 },
          );
        }
        return Response.json({ data: confirmed });
      } catch (error) {
        console.error("Failed to confirm certificate revision", error);
        return Response.json({ error: "certificates_unavailable" }, { status: 503 });
      }
    }

    // Add historical test to certificate revision
    const revisionTestsMatch = url.pathname.match(
      /^\/api\/certificate-revisions\/([^/]+)\/tests$/,
    );
    if (revisionTestsMatch) {
      if (user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      try {
        const body = (await request.json()) as Record<string, unknown>;
        const testId = readText(body, "testId", true);
        if (!testId) {
          return Response.json(
            { error: "invalid_revision_test", message: "testId is required." },
            { status: 400 },
          );
        }
        const created = await addTestToCertificateRevision(connectionString, {
          certificateRevisionId: decodeURIComponent(revisionTestsMatch[1]),
          testId,
          standardVersionId: readText(body, "standardVersionId"),
          standardClause: readText(body, "standardClause"),
          parameters: readObject(body, "parameters"),
          protocolNumber: readText(body, "protocolNumber"),
          sourcePageSection: readText(body, "sourcePageSection"),
          actorEmail: user.email,
          requestId: getRequestId(request),
        });
        return Response.json({ data: created }, { status: 201 });
      } catch (error) {
        console.error("Failed to add test to certificate revision", error);
        return Response.json({ error: "certificates_unavailable" }, { status: 503 });
      }
    }

    // Create new revision on existing certificate
    const certRevisionMatch = url.pathname.match(
      /^\/api\/certificates\/([^/]+)\/revisions$/,
    );
    if (certRevisionMatch) {
      if (user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      try {
        const body = (await request.json()) as Record<string, unknown>;
        const version = Number(body.version);
        const productCategoryId = readText(body, "productCategoryId", true);
        const productName = readText(body, "productName", true);
        const manufacturer = readText(body, "manufacturer", true);
        const regulationCode = readText(body, "regulationCode", true);
        const issuedAt = readDate(body, "issuedAt");
        const expiresAt = readDate(body, "expiresAt");

        if (
          !Number.isInteger(version) ||
          version < 1 ||
          !productCategoryId ||
          !productName ||
          !manufacturer ||
          !regulationCode ||
          issuedAt === undefined ||
          expiresAt === undefined
        ) {
          return Response.json(
            { error: "invalid_certificate_revision" },
            { status: 400 },
          );
        }

        const result = await createCertificateRevision(connectionString, {
          certificateId: decodeURIComponent(certRevisionMatch[1]),
          version,
          productCategoryId,
          productName,
          productModel: readText(body, "productModel"),
          manufacturer,
          applicant: readText(body, "applicant"),
          regulationCode,
          certificationScheme: readText(body, "certificationScheme"),
          issuedAt,
          expiresAt,
          confirmed: Boolean(body.confirmed),
          reason: readText(body, "reason"),
          actorEmail: user.email,
          requestId: getRequestId(request),
        });

        if (result.status === "not_found") {
          return Response.json({ error: "not_found" }, { status: 404 });
        }
        if (result.status === "conflict") {
          return Response.json(
            { error: "version_conflict", data: result.current },
            { status: 409 },
          );
        }
        return Response.json({ data: result.data }, { status: 201 });
      } catch (error) {
        console.error("Failed to create certificate revision", error);
        return Response.json({ error: "certificates_unavailable" }, { status: 503 });
      }
    }

    // Archive certificate
    const certArchiveMatch = url.pathname.match(
      /^\/api\/certificates\/([^/]+)\/archive$/,
    );
    if (certArchiveMatch) {
      if (user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      try {
        const body = (await request.json()) as Record<string, unknown>;
        const version = Number(body.version);
        if (!Number.isInteger(version) || version < 1) {
          return Response.json({ error: "invalid_version" }, { status: 400 });
        }
        const archived = await archiveCertificate(connectionString, {
          id: decodeURIComponent(certArchiveMatch[1]),
          version,
          reason: readText(body, "reason"),
          actorEmail: user.email,
          requestId: getRequestId(request),
        });
        if (!archived) {
          return Response.json({ error: "version_conflict" }, { status: 409 });
        }
        return Response.json({ data: archived });
      } catch (error) {
        console.error("Failed to archive certificate", error);
        return Response.json({ error: "certificates_unavailable" }, { status: 503 });
      }
    }

    if (url.pathname === "/api/certificates") {
      if (request.method !== "GET" && user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }

      try {
        if (request.method === "GET") {
          return Response.json({ data: await listCertificates(connectionString) });
        }

        if (request.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const certificateNumber = readText(body, "certificateNumber", true);
        const productCategoryId = readText(body, "productCategoryId", true);
        const productName = readText(body, "productName", true);
        const manufacturer = readText(body, "manufacturer", true);
        const regulationCode = readText(body, "regulationCode", true);
        const productModel = readText(body, "productModel");
        const applicant = readText(body, "applicant");
        const certificationScheme = readText(body, "certificationScheme");
        const issuedAt = readDate(body, "issuedAt");
        const expiresAt = readDate(body, "expiresAt");

        if (
          !certificateNumber ||
          !productCategoryId ||
          !productName ||
          !manufacturer ||
          !regulationCode ||
          issuedAt === undefined ||
          expiresAt === undefined
        ) {
          return Response.json(
            {
              error: "invalid_certificate",
              message:
                "certificateNumber, productCategoryId, productName, manufacturer and regulationCode are required.",
            },
            { status: 400 },
          );
        }

        const created = await createCertificate(connectionString, {
          certificateNumber,
          productCategoryId,
          productName,
          productModel,
          manufacturer,
          applicant,
          regulationCode,
          certificationScheme,
          issuedAt,
          expiresAt,
          confirmed: Boolean(body.confirmed),
          actorEmail: user.email,
          requestId: getRequestId(request),
        });

        return Response.json({ data: created }, { status: 201 });
      } catch (error) {
        if (
          typeof error === "object" &&
          error &&
          "code" in error &&
          error.code === "23505"
        ) {
          return Response.json({ error: "certificate_number_exists" }, { status: 409 });
        }

        console.error("Failed to process certificates", error);
        return Response.json({ error: "certificates_unavailable" }, { status: 503 });
      }
    }

    // Tests catalogue
    const testIdMatch = url.pathname.match(/^\/api\/tests\/([^/]+)$/);
    const testArchiveMatch = url.pathname.match(/^\/api\/tests\/([^/]+)\/archive$/);
    if (url.pathname === "/api/tests" || testIdMatch || testArchiveMatch) {
      if (request.method !== "GET" && user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }

      try {
        if (testArchiveMatch) {
          if (request.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
          }
          const body = (await request.json()) as Record<string, unknown>;
          const version = Number(body.version);
          if (!Number.isInteger(version) || version < 1) {
            return Response.json({ error: "invalid_version" }, { status: 400 });
          }
          const archived = await archiveTest(connectionString, {
            id: decodeURIComponent(testArchiveMatch[1]),
            version,
            actorEmail: user.email,
            requestId: getRequestId(request),
          });
          if (!archived) {
            return Response.json({ error: "version_conflict" }, { status: 409 });
          }
          return Response.json({ data: archived });
        }

        if (testIdMatch) {
          if (request.method !== "PATCH") {
            return new Response("Method not allowed", { status: 405 });
          }
          const body = (await request.json()) as Record<string, unknown>;
          const version = Number(body.version);
          const name = readText(body, "name", true);
          if (!Number.isInteger(version) || version < 1 || !name) {
            return Response.json({ error: "invalid_test" }, { status: 400 });
          }
          const updated = await updateTest(connectionString, {
            id: decodeURIComponent(testIdMatch[1]),
            version,
            name,
            method: readText(body, "method"),
            unit: readText(body, "unit"),
            defaultParameters: readObject(body, "defaultParameters"),
            actorEmail: user.email,
            requestId: getRequestId(request),
          });
          if (!updated) {
            return Response.json({ error: "version_conflict" }, { status: 409 });
          }
          return Response.json({ data: updated });
        }

        if (request.method === "GET") {
          return Response.json({ data: await listTests(connectionString) });
        }

        if (request.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const code = readText(body, "code", true);
        const name = readText(body, "name", true);
        if (!code || !name) {
          return Response.json(
            { error: "invalid_test", message: "code and name are required." },
            { status: 400 },
          );
        }

        const created = await createTest(connectionString, {
          code,
          name,
          method: readText(body, "method"),
          unit: readText(body, "unit"),
          defaultParameters: readObject(body, "defaultParameters"),
          actorEmail: user.email,
          requestId: getRequestId(request),
        });
        return Response.json({ data: created }, { status: 201 });
      } catch (error) {
        if (
          typeof error === "object" &&
          error &&
          "code" in error &&
          error.code === "23505"
        ) {
          return Response.json({ error: "test_code_exists" }, { status: 409 });
        }
        console.error("Failed to process tests", error);
        return Response.json({ error: "tests_unavailable" }, { status: 503 });
      }
    }

    // Regulations & versions
    if (url.pathname === "/api/regulations") {
      if (request.method !== "GET" && user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }
      try {
        if (request.method === "GET") {
          return Response.json({ data: await listRegulations(connectionString) });
        }
        if (request.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }
        const body = (await request.json()) as Record<string, unknown>;
        const code = readText(body, "code", true);
        const name = readText(body, "name", true);
        const versionLabel = readText(body, "versionLabel", true);
        const effectiveFrom = readDate(body, "effectiveFrom");
        const effectiveTo = readDate(body, "effectiveTo");
        if (
          !code ||
          !name ||
          !versionLabel ||
          !effectiveFrom ||
          effectiveTo === undefined
        ) {
          return Response.json({ error: "invalid_regulation" }, { status: 400 });
        }
        const created = await createRegulationWithVersion(connectionString, {
          code,
          name,
          versionLabel,
          effectiveFrom,
          effectiveTo,
          actorEmail: user.email,
          requestId: getRequestId(request),
        });
        return Response.json({ data: created }, { status: 201 });
      } catch (error) {
        console.error("Failed to process regulations", error);
        return Response.json({ error: "regulations_unavailable" }, { status: 503 });
      }
    }

    // Standards & versions
    if (url.pathname === "/api/standards") {
      if (request.method !== "GET" && user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }
      try {
        if (request.method === "GET") {
          return Response.json({ data: await listStandards(connectionString) });
        }
        if (request.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }
        const body = (await request.json()) as Record<string, unknown>;
        const code = readText(body, "code", true);
        const name = readText(body, "name", true);
        const versionLabel = readText(body, "versionLabel", true);
        const effectiveFrom = readDate(body, "effectiveFrom");
        const effectiveTo = readDate(body, "effectiveTo");
        if (
          !code ||
          !name ||
          !versionLabel ||
          !effectiveFrom ||
          effectiveTo === undefined
        ) {
          return Response.json({ error: "invalid_standard" }, { status: 400 });
        }
        const created = await createStandardWithVersion(connectionString, {
          code,
          name,
          versionLabel,
          effectiveFrom,
          effectiveTo,
          actorEmail: user.email,
          requestId: getRequestId(request),
        });
        return Response.json({ data: created }, { status: 201 });
      } catch (error) {
        console.error("Failed to process standards", error);
        return Response.json({ error: "standards_unavailable" }, { status: 503 });
      }
    }

    // Regulatory datasets, requirements & publishing
    const datasetReqMatch = url.pathname.match(
      /^\/api\/regulatory-datasets\/([^/]+)\/requirements$/,
    );
    const datasetPublishMatch = url.pathname.match(
      /^\/api\/regulatory-datasets\/([^/]+)\/publish$/,
    );
    const reqReviewMatch = url.pathname.match(/^\/api\/requirements\/([^/]+)\/review$/);

    if (reqReviewMatch) {
      if (user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      try {
        const body = (await request.json()) as Record<string, unknown>;
        const reviewStatus = readText(body, "reviewStatus", true);
        const reason = readText(body, "reason", true);
        if ((reviewStatus !== "approved" && reviewStatus !== "rejected") || !reason) {
          return Response.json(
            {
              error: "invalid_review",
              message: "reviewStatus ('approved'|'rejected') and reason are required.",
            },
            { status: 400 },
          );
        }
        const result = await reviewRequirement(connectionString, {
          requirementId: decodeURIComponent(reqReviewMatch[1]),
          reviewStatus,
          reason,
          actorEmail: user.email,
          requestId: getRequestId(request),
        });
        if (result.status === "not_found") {
          return Response.json({ error: "not_found" }, { status: 404 });
        }
        if (result.status === "dataset_immutable") {
          return Response.json(
            {
              error: "dataset_immutable",
              message: `Cannot review requirements in a '${result.datasetStatus}' dataset.`,
            },
            { status: 409 },
          );
        }
        return Response.json({ data: result.data });
      } catch (error) {
        console.error("Failed to review requirement", error);
        return Response.json({ error: "datasets_unavailable" }, { status: 503 });
      }
    }

    if (datasetReqMatch) {
      if (user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      try {
        const body = (await request.json()) as Record<string, unknown>;
        const productCategoryId = readText(body, "productCategoryId", true);
        const regulationVersionId = readText(body, "regulationVersionId", true);
        const provision = readText(body, "provision", true);
        const standardVersionId = readText(body, "standardVersionId", true);
        const standardClause = readText(body, "standardClause", true);
        const testId = readText(body, "testId", true);
        const effectiveFrom = readDate(body, "effectiveFrom");
        const effectiveTo = readDate(body, "effectiveTo");
        const sourceReference = readText(body, "sourceReference", true);
        const sourcePageSection = readText(body, "sourcePageSection", true);

        if (
          !productCategoryId ||
          !regulationVersionId ||
          !provision ||
          !standardVersionId ||
          !standardClause ||
          !testId ||
          !effectiveFrom ||
          effectiveTo === undefined ||
          !sourceReference ||
          !sourcePageSection
        ) {
          return Response.json({ error: "invalid_requirement" }, { status: 400 });
        }

        const result = await addRequirementToDataset(connectionString, {
          datasetId: decodeURIComponent(datasetReqMatch[1]),
          productCategoryId,
          regulationVersionId,
          provision,
          standardVersionId,
          standardClause,
          testId,
          parameters: readObject(body, "parameters"),
          effectiveFrom,
          effectiveTo,
          sourceReference,
          sourcePageSection,
          extractionMethod: readText(body, "extractionMethod") ?? "manual",
          reason: readText(body, "reason"),
          actorEmail: user.email,
          requestId: getRequestId(request),
        });

        if (result.status === "dataset_not_found") {
          return Response.json({ error: "not_found" }, { status: 404 });
        }
        if (result.status === "dataset_immutable") {
          return Response.json(
            {
              error: "dataset_immutable",
              message: `Published or superseded datasets cannot be edited in place.`,
            },
            { status: 409 },
          );
        }
        return Response.json({ data: result.data }, { status: 201 });
      } catch (error) {
        console.error("Failed to add requirement to dataset", error);
        return Response.json({ error: "datasets_unavailable" }, { status: 503 });
      }
    }

    if (datasetPublishMatch) {
      if (user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      try {
        const body = (await request.json()) as Record<string, unknown>;
        const reason = readText(body, "reason", true) ?? "";
        const result = await publishRegulatoryDataset(connectionString, {
          datasetId: decodeURIComponent(datasetPublishMatch[1]),
          reason,
          actorEmail: user.email,
          requestId: getRequestId(request),
        });

        if (result.status === "not_found") {
          return Response.json({ error: "not_found" }, { status: 404 });
        }
        if (result.status === "validation_failed") {
          return Response.json(
            {
              error: "publish_validation_failed",
              errors: result.validation.errors,
            },
            { status: 422 },
          );
        }
        return Response.json({
          data: result.dataset,
          supersededIds: result.supersededIds,
        });
      } catch (error) {
        console.error("Failed to publish regulatory dataset", error);
        return Response.json({ error: "datasets_unavailable" }, { status: 503 });
      }
    }

    if (url.pathname === "/api/regulatory-datasets") {
      if (request.method !== "GET" && user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }

      try {
        if (request.method === "GET") {
          const datasets = await listRegulatoryDatasets(connectionString, {
            includeNonPublished: user.role === "admin",
          });
          return Response.json({ data: datasets });
        }

        if (request.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const code = readText(body, "code", true);
        const regulationId = readText(body, "regulationId", true);
        const title = readText(body, "title", true);
        const effectiveFrom = readDate(body, "effectiveFrom");
        const effectiveTo = readDate(body, "effectiveTo");
        const datasetVersion = body.datasetVersion ? Number(body.datasetVersion) : 1;

        if (
          !code ||
          !regulationId ||
          !title ||
          !effectiveFrom ||
          effectiveTo === undefined
        ) {
          return Response.json({ error: "invalid_regulatory_dataset" }, { status: 400 });
        }

        const created = await createRegulatoryDataset(connectionString, {
          code,
          regulationId,
          title,
          datasetVersion,
          effectiveFrom,
          effectiveTo,
          reason: readText(body, "reason"),
          actorEmail: user.email,
          requestId: getRequestId(request),
        });
        return Response.json({ data: created }, { status: 201 });
      } catch (error) {
        if (
          typeof error === "object" &&
          error &&
          "code" in error &&
          error.code === "23505"
        ) {
          return Response.json({ error: "dataset_code_exists" }, { status: 409 });
        }
        console.error("Failed to process regulatory datasets", error);
        return Response.json({ error: "datasets_unavailable" }, { status: 503 });
      }
    }

    // Assessments
    if (url.pathname === "/api/assessments") {
      try {
        if (request.method === "GET") {
          const items = await listAssessments(connectionString);
          return Response.json({ data: items });
        }

        if (request.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const certificateRevisionId = readText(body, "certificateRevisionId", true);
        const assessmentDate = readDate(body, "assessmentDate");

        if (!certificateRevisionId || !assessmentDate) {
          return Response.json(
            {
              error: "invalid_assessment_request",
              message:
                "certificateRevisionId and assessmentDate (YYYY-MM-DD) are required.",
            },
            { status: 400 },
          );
        }

        const result = await runAssessment(connectionString, {
          certificateRevisionId,
          assessmentDate,
          actorEmail: user.email,
          requestId: getRequestId(request),
        });

        if (result.status === "revision_not_found") {
          return Response.json(
            { error: "certificate_revision_not_found" },
            { status: 404 },
          );
        }

        return Response.json({ data: result.data }, { status: 201 });
      } catch (error) {
        console.error("Failed to run or list assessments", error);
        return Response.json({ error: "assessments_unavailable" }, { status: 503 });
      }
    }

    if (url.pathname === "/api/audit-events") {
      if (user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }

      if (request.method !== "GET")
        return new Response("Method not allowed", { status: 405 });

      try {
        const events = await listRecentAuditEvents(connectionString);
        return Response.json({ data: events });
      } catch (error) {
        console.error("Failed to read audit events", error);
        return Response.json({ error: "audit_unavailable" }, { status: 503 });
      }
    }

    // Product categories
    const categoryIdMatch = url.pathname.match(/^\/api\/product-categories\/([^/]+)$/);
    const categoryArchiveMatch = url.pathname.match(
      /^\/api\/product-categories\/([^/]+)\/archive$/,
    );

    if (
      url.pathname === "/api/product-categories" ||
      categoryIdMatch ||
      categoryArchiveMatch
    ) {
      if (request.method !== "GET" && user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }

      try {
        if (categoryArchiveMatch) {
          if (request.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
          }
          const body = (await request.json()) as Record<string, unknown>;
          const version = Number(body.version);
          if (!Number.isInteger(version) || version < 1) {
            return Response.json({ error: "invalid_version" }, { status: 400 });
          }
          const archived = await archiveProductCategory(connectionString, {
            id: decodeURIComponent(categoryArchiveMatch[1]),
            version,
            reason: readText(body, "reason"),
            actorEmail: user.email,
            requestId: getRequestId(request),
          });
          if (!archived) {
            return Response.json({ error: "version_conflict" }, { status: 409 });
          }
          return Response.json({ data: archived });
        }

        if (categoryIdMatch) {
          if (request.method !== "PATCH")
            return new Response("Method not allowed", { status: 405 });

          const body = (await request.json()) as Record<string, unknown>;
          const version = Number(body.version);
          const translations = parseProductCategoryTranslations(body.translations);

          if (!Number.isInteger(version) || version < 1 || !translations) {
            return Response.json(
              {
                error: "invalid_product_category",
                message: "version and an English translation are required.",
              },
              { status: 400 },
            );
          }

          const updated = await updateProductCategory(connectionString, {
            id: decodeURIComponent(categoryIdMatch[1]),
            version,
            translations,
            reason: readText(body, "reason"),
            actorEmail: user.email,
            requestId: getRequestId(request),
          });

          if (updated) return Response.json({ data: updated });

          const current = await getProductCategory(
            connectionString,
            decodeURIComponent(categoryIdMatch[1]),
          );

          if (!current) return Response.json({ error: "not_found" }, { status: 404 });

          return Response.json(
            { error: "version_conflict", data: current },
            { status: 409 },
          );
        }

        if (request.method === "GET") {
          const categories = await listActiveProductCategories(connectionString);
          return Response.json({ data: categories });
        }

        if (request.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const code = readText(body, "code", true);
        const translations = parseProductCategoryTranslations(body.translations);
        if (!code || !translations) {
          return Response.json(
            {
              error: "invalid_product_category",
              message: "code and an English translation are required.",
            },
            { status: 400 },
          );
        }

        const created = await createProductCategory(connectionString, {
          code,
          translations,
          reason: readText(body, "reason"),
          actorEmail: user.email,
          requestId: getRequestId(request),
        });
        return Response.json({ data: created }, { status: 201 });
      } catch (error) {
        if (
          typeof error === "object" &&
          error &&
          "code" in error &&
          error.code === "23505"
        ) {
          return Response.json({ error: "category_code_exists" }, { status: 409 });
        }
        console.error("Failed to process product categories", error);
        return Response.json({ error: "catalogue_unavailable" }, { status: 503 });
      }
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
