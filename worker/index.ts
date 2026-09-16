import { listActiveProductCategories } from "../src/db/repository";

export interface Env {
  DATABASE_URL?: string;
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
      const connectionString = env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;

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
