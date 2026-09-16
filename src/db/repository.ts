import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { productCategories } from "./schema";

export async function listActiveProductCategories(connectionString: string) {
  const client = new Client({ connectionString });

  await client.connect();

  try {
    const db = drizzle(client);

    return await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.status, "active"))
      .orderBy(asc(productCategories.code))
      .limit(100);
  } finally {
    await client.end();
  }
}
