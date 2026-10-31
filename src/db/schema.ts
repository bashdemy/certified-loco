import {
  date,
  index,
  integer,
  jsonb,
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
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    confirmedByEmail: varchar("confirmed_by_email", { length: 320 }),
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

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storageKey: varchar("storage_key", { length: 500 }).notNull(),
    originalFilename: varchar("original_filename", { length: 500 }).notNull(),
    contentType: varchar("content_type", { length: 150 }).notNull(),
    sizeBytes: integer("size_bytes"),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    createdByEmail: varchar("created_by_email", { length: 320 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("documents_storage_key_idx").on(table.storageKey)],
);

export const certificateRevisionDocuments = pgTable(
  "certificate_revision_documents",
  {
    certificateRevisionId: uuid("certificate_revision_id")
      .notNull()
      .references(() => certificateRevisions.id, { onDelete: "restrict" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.certificateRevisionId, table.documentId] }),
    index("certificate_revision_documents_document_idx").on(table.documentId),
  ],
);

export const regulations = pgTable(
  "regulations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 100 }).notNull(),
    name: varchar("name", { length: 500 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("regulations_code_idx").on(table.code)],
);

export const regulationVersions = pgTable(
  "regulation_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    regulationId: uuid("regulation_id")
      .notNull()
      .references(() => regulations.id, { onDelete: "restrict" }),
    versionLabel: varchar("version_label", { length: 100 }).notNull(),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("regulation_versions_label_idx").on(
      table.regulationId,
      table.versionLabel,
    ),
  ],
);

export const standards = pgTable(
  "standards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 100 }).notNull(),
    name: varchar("name", { length: 500 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("standards_code_idx").on(table.code)],
);

export const standardVersions = pgTable(
  "standard_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    standardId: uuid("standard_id")
      .notNull()
      .references(() => standards.id, { onDelete: "restrict" }),
    versionLabel: varchar("version_label", { length: 100 }).notNull(),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("standard_versions_label_idx").on(table.standardId, table.versionLabel),
  ],
);

export const tests = pgTable(
  "tests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    method: varchar("method", { length: 255 }),
    unit: varchar("unit", { length: 100 }),
    defaultParametersJson: jsonb("default_parameters_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("tests_code_idx").on(table.code)],
);

export const certificateRevisionTests = pgTable(
  "certificate_revision_tests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    certificateRevisionId: uuid("certificate_revision_id")
      .notNull()
      .references(() => certificateRevisions.id, { onDelete: "restrict" }),
    testId: uuid("test_id")
      .notNull()
      .references(() => tests.id, { onDelete: "restrict" }),
    standardVersionId: uuid("standard_version_id").references(() => standardVersions.id, {
      onDelete: "restrict",
    }),
    standardClause: varchar("standard_clause", { length: 150 }),
    parametersJson: jsonb("parameters_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    protocolNumber: varchar("protocol_number", { length: 150 }),
    sourcePageSection: varchar("source_page_section", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("certificate_revision_tests_revision_idx").on(table.certificateRevisionId),
  ],
);

export const regulatoryDatasets = pgTable(
  "regulatory_datasets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 100 }).notNull(),
    regulationId: uuid("regulation_id")
      .notNull()
      .references(() => regulations.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 255 }).notNull(),
    datasetVersion: integer("dataset_version").notNull().default(1),
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    version: integer("version").notNull().default(1),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedByEmail: varchar("published_by_email", { length: 320 }),
    supersededAt: timestamp("superseded_at", { withTimezone: true }),
    createdByEmail: varchar("created_by_email", { length: 320 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("regulatory_datasets_code_idx").on(table.code),
    index("regulatory_datasets_regulation_status_idx").on(
      table.regulationId,
      table.status,
    ),
  ],
);

export const requirements = pgTable(
  "requirements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    datasetId: uuid("dataset_id")
      .notNull()
      .references(() => regulatoryDatasets.id, { onDelete: "restrict" }),
    productCategoryId: uuid("product_category_id")
      .notNull()
      .references(() => productCategories.id, { onDelete: "restrict" }),
    regulationVersionId: uuid("regulation_version_id")
      .notNull()
      .references(() => regulationVersions.id, { onDelete: "restrict" }),
    provision: varchar("provision", { length: 255 }).notNull(),
    standardVersionId: uuid("standard_version_id")
      .notNull()
      .references(() => standardVersions.id, { onDelete: "restrict" }),
    standardClause: varchar("standard_clause", { length: 150 }).notNull(),
    testId: uuid("test_id")
      .notNull()
      .references(() => tests.id, { onDelete: "restrict" }),
    parametersJson: jsonb("parameters_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    sourceDocumentId: uuid("source_document_id").references(() => documents.id, {
      onDelete: "restrict",
    }),
    sourceReference: varchar("source_reference", { length: 500 }).notNull(),
    sourcePageSection: varchar("source_page_section", { length: 255 }).notNull(),
    extractionMethod: varchar("extraction_method", { length: 50 })
      .notNull()
      .default("manual"),
    reviewStatus: varchar("review_status", { length: 30 })
      .notNull()
      .default("pending_review"),
    reviewedByEmail: varchar("reviewed_by_email", { length: 320 }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("requirements_dataset_category_idx").on(
      table.datasetId,
      table.productCategoryId,
    ),
  ],
);

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    certificateRevisionId: uuid("certificate_revision_id")
      .notNull()
      .references(() => certificateRevisions.id, { onDelete: "restrict" }),
    productCategoryId: uuid("product_category_id")
      .notNull()
      .references(() => productCategories.id, { onDelete: "restrict" }),
    productCategoryVersion: integer("product_category_version").notNull(),
    regulatoryDatasetId: uuid("regulatory_dataset_id").references(
      () => regulatoryDatasets.id,
      { onDelete: "restrict" },
    ),
    assessmentDate: date("assessment_date").notNull(),
    overallStatus: varchar("overall_status", { length: 30 }).notNull(),
    summaryCountsJson: jsonb("summary_counts_json").notNull(),
    inputSnapshotJson: jsonb("input_snapshot_json").notNull(),
    resultsSnapshotJson: jsonb("results_snapshot_json").notNull(),
    createdByEmail: varchar("created_by_email", { length: 320 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("assessments_revision_idx").on(table.certificateRevisionId),
    index("assessments_created_at_idx").on(table.createdAt),
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
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type CertificateRevisionDocument =
  typeof certificateRevisionDocuments.$inferSelect;
export type Regulation = typeof regulations.$inferSelect;
export type RegulationVersion = typeof regulationVersions.$inferSelect;
export type Standard = typeof standards.$inferSelect;
export type StandardVersion = typeof standardVersions.$inferSelect;
export type TestCatalogueItem = typeof tests.$inferSelect;
export type CertificateRevisionTest = typeof certificateRevisionTests.$inferSelect;
export type RegulatoryDataset = typeof regulatoryDatasets.$inferSelect;
export type RequirementRecord = typeof requirements.$inferSelect;
export type AssessmentRecord = typeof assessments.$inferSelect;
