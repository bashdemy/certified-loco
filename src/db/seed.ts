import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { productCategories } from "./schema";

const developmentCategories = [
  {
    code: "wheelset_locomotive",
    nameRu: "Колесные пары локомотивов",
    nameKk: "Локомотивтердің дөңгелек жұптары",
    nameEn: "Locomotive wheelsets",
    description: "Development catalogue record for the first assessment slice.",
  },
  {
    code: "wheelset_wagon",
    nameRu: "Колесные пары вагонов",
    nameKk: "Вагондардың дөңгелек жұптары",
    nameEn: "Wagon wheelsets",
    description: "Development catalogue record for the first assessment slice.",
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

    await db
      .insert(productCategories)
      .values(developmentCategories)
      .onConflictDoNothing({ target: productCategories.code });

    console.log(`Seeded ${developmentCategories.length} product categories.`);
  } finally {
    await client.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
