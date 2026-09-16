import { listActiveProductCategories } from "../src/db/repository";

export interface Env {
  HYPERDRIVE?: {
    connectionString: string;
  };
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

    if (url.pathname === "/api/product-categories") {
      if (!env.HYPERDRIVE) {
        return Response.json(
          {
            error: "database_not_configured",
            message: "Configure the HYPERDRIVE binding before using the catalogue API.",
          },
          { status: 503 },
        );
      }

      try {
        const categories = await listActiveProductCategories(
          env.HYPERDRIVE.connectionString,
        );

        return Response.json({ data: categories });
      } catch (error) {
        console.error("Failed to read product categories", error);
        return Response.json(
          { error: "catalogue_unavailable" },
          { status: 503 },
        );
      }
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
