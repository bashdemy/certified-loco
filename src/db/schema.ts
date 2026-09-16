import {
  integer,
  index,
  jsonb,
  date,
  pgTable,
  primaryKey,
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
    status: varchar("status", { length: 20 }).notNull().default("active"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("product_categories_code_idx").on(table.code)],
);

export const productCategoryTranslations = pgTable(
  "product_category_translations",
  {
    productCategoryId: uuid("product_category_id")
      .notNull()
      .references(() => productCategories.id, { onDelete: "cascade" }),
    locale: varchar("locale", { length: 10 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
  },
  (table) => [primaryKey({ columns: [table.productCategoryId, table.locale] })],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorEmail: varchar("actor_email", { length: 320 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    requestId: varchar("request_id", { length: 100 }).notNull(),
    reason: text("reason"),
    beforeJson: jsonb("before_json"),
    afterJson: jsonb("after_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_events_entity_idx").on(table.entityType, table.entityId),
    index("audit_events_created_at_idx").on(table.createdAt),
  ],
);

export const certificates = pgTable(
  "certificates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    certificateNumber: varchar("certificate_number", { length: 150 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("certificates_number_idx").on(table.certificateNumber)],
);

export const certificateRevisions = pgTable(
  "certificate_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    certificateId: uuid("certificate_id")
      .notNull()
      .references(() => certificates.id, { onDelete: "restrict" }),
    revisionNumber: integer("revision_number").notNull(),
    productCategoryId: uuid("product_category_id")
      .notNull()
      .references(() => productCategories.id, { onDelete: "restrict" }),
    productName: varchar("product_name", { length: 500 }).notNull(),
    productModel: varchar("product_model", { length: 255 }),
    manufacturer: varchar("manufacturer", { length: 500 }).notNull(),
    applicant: varchar("applicant", { length: 500 }),
    regulationCode: varchar("regulation_code", { length: 100 }).notNull(),
    certificationScheme: varchar("certification_scheme", { length: 100 }),
    issuedAt: date("issued_at"),
    expiresAt: date("expires_at"),
    createdByEmail: varchar("created_by_email", { length: 320 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("certificate_revisions_number_idx").on(
      table.certificateId,
      table.revisionNumber,
    ),
    index("certificate_revisions_category_idx").on(table.productCategoryId),
  ],
);

export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;
export type ProductCategoryTranslation = typeof productCategoryTranslations.$inferSelect;
export type NewProductCategoryTranslation =
  typeof productCategoryTranslations.$inferInsert;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
export type CertificateRevision = typeof certificateRevisions.$inferSelect;
export type NewCertificateRevision = typeof certificateRevisions.$inferInsert;
