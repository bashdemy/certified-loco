import {
  getProductCategory,
  listActiveProductCategories,
  updateProductCategory,
} from "../src/db/repository";

export interface Env {
  DATABASE_URL?: string;
  HYPERDRIVE?: {
    connectionString: string;
  };
}

const supportedLocales = ["en", "ru", "kk"] as const;

function getConnectionString(env: Env) {
  return env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;
}

function parseTranslations(value: unknown) {
  if (!Array.isArray(value)) return null;

  const translations = value.map((item) => {
    if (!item || typeof item !== "object") return null;
    const translation = item as Record<string, unknown>;
    const locale = typeof translation.locale === "string" ? translation.locale : "";
    const name = typeof translation.name === "string" ? translation.name.trim() : "";
    const description =
      translation.description == null ? null : String(translation.description).trim();

    if (
      !supportedLocales.includes(locale as (typeof supportedLocales)[number]) ||
      !name
    ) {
      return null;
    }

    return { locale, name, description };
  });

  if (
    translations.some((translation) => translation === null) ||
    new Set(translations.map((translation) => translation?.locale)).size !==
      translations.length ||
    !translations.some((translation) => translation?.locale === "en")
  ) {
    return null;
  }

  return translations as Array<{
    locale: string;
    name: string;
    description: string | null;
  }>;
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

    if (url.pathname === "/api/product-categories" || categoryIdMatch) {
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
          const translations = parseTranslations(body.translations);

          if (!Number.isInteger(version) || version < 1 || !translations) {
            return Response.json(
              {
                error: "invalid_product_category",
                message:
                  "version and English, Russian, and Kazakh translations are required.",
              },
              { status: 400 },
            );
          }

          const updated = await updateProductCategory(connectionString, {
            id: decodeURIComponent(categoryIdMatch[1]),
            version,
            translations,
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
