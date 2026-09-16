import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { type ProductCategoryTranslationInput } from "../domain/product-category-translations";
import { productCategories, productCategoryTranslations } from "./schema";

export type ProductCategoryWithTranslations = {
  id: string;
  code: string;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  translations: ProductCategoryTranslationInput[];
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

export async function updateProductCategory(
  connectionString: string,
  input: {
    id: string;
    version: number;
    translations: ProductCategoryTranslationInput[];
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);

    return await db.transaction(async (tx) => {
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

      return {
        ...updated[0],
        translations: input.translations,
      };
    });
  } finally {
    await client.end();
  }
}
