import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { productCategories, productCategoryTranslations } from "./schema";

const developmentCategories = [
  {
    code: "wheelset_locomotive",
    translations: {
      en: "Locomotive wheelsets",
      ru: "Колесные пары локомотивов",
      kk: "Локомотивтердің дөңгелек жұптары",
    },
  },
  {
    code: "wheelset_wagon",
    translations: {
      en: "Wagon wheelsets",
      ru: "Колесные пары вагонов",
      kk: "Вагондардың дөңгелек жұптары",
    },
  },
];

async function seed() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to seed the database");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);

    await db.transaction(async (tx) => {
      await tx
        .insert(productCategories)
        .values(developmentCategories.map(({ code }) => ({ code })))
        .onConflictDoNothing({ target: productCategories.code });

      const categories = await tx.select().from(productCategories);
      const categoryIds = new Map(
        categories.map((category) => [category.code, category.id]),
      );

      await tx
        .insert(productCategoryTranslations)
        .values(
          developmentCategories.flatMap((category) => {
            const productCategoryId = categoryIds.get(category.code);
            if (!productCategoryId) throw new Error(`Missing category ${category.code}`);

            return Object.entries(category.translations).map(([locale, name]) => ({
              productCategoryId,
              locale,
              name,
              description: "Development catalogue record for the first assessment slice.",
            }));
          }),
        )
        .onConflictDoNothing();
    });

    console.log(`Seeded ${developmentCategories.length} product categories.`);
  } finally {
    await client.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
