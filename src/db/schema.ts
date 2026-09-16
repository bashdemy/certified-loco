import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const productCategories = pgTable(
  "product_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 100 }).notNull(),
    nameRu: varchar("name_ru", { length: 255 }).notNull(),
    nameKk: varchar("name_kk", { length: 255 }).notNull(),
    nameEn: varchar("name_en", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("product_categories_code_idx").on(table.code)],
);

export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;
