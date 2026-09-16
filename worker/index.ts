import {
  getProductCategory,
  listActiveProductCategories,
  listCertificates,
  listRecentAuditEvents,
  createCertificate,
  updateProductCategory,
} from "../src/db/repository";
import { parseProductCategoryTranslations } from "../src/domain/product-category-translations";
import { authenticateRequest } from "../src/infrastructure/auth/cloudflare-access";

export interface Env {
  DATABASE_URL?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUDIENCE?: string;
  ADMIN_EMAILS?: string;
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        service: "certified-loco-api",
      });
    }

    const categoryIdMatch = url.pathname.match(/^\/api\/product-categories\/([^/]+)$/);

    if (url.pathname === "/api/certificates") {
      const user = await authenticateRequest(request, env);

      if (!user) {
        return Response.json(
          { error: "authentication_required" },
          { status: 401, headers: { "WWW-Authenticate": "Cloudflare Access" } },
        );
      }

      if (request.method !== "GET" && user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }

      const connectionString = getConnectionString(env);
      if (!connectionString) {
        return Response.json({ error: "database_not_configured" }, { status: 503 });
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
          actorEmail: user.email,
          requestId: request.headers.get("X-Request-ID") ?? crypto.randomUUID(),
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

    if (url.pathname === "/api/audit-events") {
      const user = await authenticateRequest(request, env);

      if (!user) {
        return Response.json(
          { error: "authentication_required" },
          { status: 401, headers: { "WWW-Authenticate": "Cloudflare Access" } },
        );
      }

      if (user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
      }

      if (request.method !== "GET")
        return new Response("Method not allowed", { status: 405 });

      const connectionString = getConnectionString(env);
      if (!connectionString) {
        return Response.json({ error: "database_not_configured" }, { status: 503 });
      }

      try {
        const events = await listRecentAuditEvents(connectionString);
        return Response.json({ data: events });
      } catch (error) {
        console.error("Failed to read audit events", error);
        return Response.json({ error: "audit_unavailable" }, { status: 503 });
      }
    }

    if (url.pathname === "/api/product-categories" || categoryIdMatch) {
      const user = await authenticateRequest(request, env);

      if (!user) {
        return Response.json(
          { error: "authentication_required" },
          { status: 401, headers: { "WWW-Authenticate": "Cloudflare Access" } },
        );
      }

      if (categoryIdMatch && user.role !== "admin") {
        return Response.json({ error: "admin_required" }, { status: 403 });
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

      try {
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
            actorEmail: user.email,
            requestId: request.headers.get("X-Request-ID") ?? crypto.randomUUID(),
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

        if (request.method !== "GET")
          return new Response("Method not allowed", { status: 405 });

        const categories = await listActiveProductCategories(connectionString);

        return Response.json({ data: categories });
      } catch (error) {
        console.error("Failed to read product categories", error);
        return Response.json({ error: "catalogue_unavailable" }, { status: 503 });
      }
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
