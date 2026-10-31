import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

export async function runMigrations(connectionString: string) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    try {
      await migrate(db, {
        migrationsFolder: path.resolve(process.cwd(), "db/migrations"),
      });
    } catch (error) {
      // If earlier migrations were applied before drizzle's journal table existed,
      // apply any pending migration files safely when a relation-already-exists error occurs.
      if (
        typeof error === "object" &&
        error &&
        "cause" in error &&
        typeof error.cause === "object" &&
        error.cause &&
        "code" in error.cause &&
        error.cause.code === "42P07"
      ) {
        await applyPendingSqlIdempotently(client);
      } else if (
        typeof error === "object" &&
        error &&
        "code" in error &&
        error.code === "42P07"
      ) {
        await applyPendingSqlIdempotently(client);
      } else {
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

async function applyPendingSqlIdempotently(client: Client) {
  const migrationsDir = path.resolve(process.cwd(), "db/migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sqlContent = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    const statements = sqlContent
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      try {
        await client.query(stmt);
      } catch (err) {
        const pgCode =
          typeof err === "object" && err && "code" in err
            ? String((err as { code?: unknown }).code)
            : "";
        // Ignore already-exists / column-already-dropped codes when reconciling legacy local DB
        if (["42P07", "42710", "42701", "42703"].includes(pgCode)) {
          continue;
        }
        throw err;
      }
    }
  }
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);

if (isMain) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required to run migrations");
    process.exit(1);
  }
  runMigrations(connectionString)
    .then(() => {
      console.log("Database migrations completed.");
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
