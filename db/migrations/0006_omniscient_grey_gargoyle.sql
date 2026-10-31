CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_revision_id" uuid NOT NULL,
	"product_category_id" uuid NOT NULL,
	"product_category_version" integer NOT NULL,
	"regulatory_dataset_id" uuid,
	"assessment_date" date NOT NULL,
	"overall_status" varchar(30) NOT NULL,
	"summary_counts_json" jsonb NOT NULL,
	"input_snapshot_json" jsonb NOT NULL,
	"results_snapshot_json" jsonb NOT NULL,
	"created_by_email" varchar(320) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificate_revision_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_revision_id" uuid NOT NULL,
	"test_id" uuid NOT NULL,
	"standard_version_id" uuid,
	"standard_clause" varchar(150),
	"parameters_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"protocol_number" varchar(150),
	"source_page_section" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulation_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regulation_id" uuid NOT NULL,
	"version_label" varchar(100) NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(500) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_datasets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"regulation_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"dataset_version" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"version" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp with time zone,
	"published_by_email" varchar(320),
	"superseded_at" timestamp with time zone,
	"created_by_email" varchar(320) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dataset_id" uuid NOT NULL,
	"product_category_id" uuid NOT NULL,
	"regulation_version_id" uuid NOT NULL,
	"provision" varchar(255) NOT NULL,
	"standard_version_id" uuid NOT NULL,
	"standard_clause" varchar(150) NOT NULL,
	"test_id" uuid NOT NULL,
	"parameters_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"source_document_id" uuid,
	"source_reference" varchar(500) NOT NULL,
	"source_page_section" varchar(255) NOT NULL,
	"extraction_method" varchar(50) DEFAULT 'manual' NOT NULL,
	"review_status" varchar(30) DEFAULT 'pending_review' NOT NULL,
	"reviewed_by_email" varchar(320),
	"reviewed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "standard_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"standard_id" uuid NOT NULL,
	"version_label" varchar(100) NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "standards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(500) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"method" varchar(255),
	"unit" varchar(100),
	"default_parameters_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certificate_revisions" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "certificate_revisions" ADD COLUMN "confirmed_by_email" varchar(320);--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_certificate_revision_id_certificate_revisions_id_fk" FOREIGN KEY ("certificate_revision_id") REFERENCES "public"."certificate_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_product_category_id_product_categories_id_fk" FOREIGN KEY ("product_category_id") REFERENCES "public"."product_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_regulatory_dataset_id_regulatory_datasets_id_fk" FOREIGN KEY ("regulatory_dataset_id") REFERENCES "public"."regulatory_datasets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_revision_tests" ADD CONSTRAINT "certificate_revision_tests_certificate_revision_id_certificate_revisions_id_fk" FOREIGN KEY ("certificate_revision_id") REFERENCES "public"."certificate_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_revision_tests" ADD CONSTRAINT "certificate_revision_tests_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_revision_tests" ADD CONSTRAINT "certificate_revision_tests_standard_version_id_standard_versions_id_fk" FOREIGN KEY ("standard_version_id") REFERENCES "public"."standard_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulation_versions" ADD CONSTRAINT "regulation_versions_regulation_id_regulations_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_datasets" ADD CONSTRAINT "regulatory_datasets_regulation_id_regulations_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_dataset_id_regulatory_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."regulatory_datasets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_product_category_id_product_categories_id_fk" FOREIGN KEY ("product_category_id") REFERENCES "public"."product_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_regulation_version_id_regulation_versions_id_fk" FOREIGN KEY ("regulation_version_id") REFERENCES "public"."regulation_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_standard_version_id_standard_versions_id_fk" FOREIGN KEY ("standard_version_id") REFERENCES "public"."standard_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standard_versions" ADD CONSTRAINT "standard_versions_standard_id_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."standards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessments_revision_idx" ON "assessments" USING btree ("certificate_revision_id");--> statement-breakpoint
CREATE INDEX "assessments_created_at_idx" ON "assessments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "certificate_revision_tests_revision_idx" ON "certificate_revision_tests" USING btree ("certificate_revision_id");--> statement-breakpoint
CREATE UNIQUE INDEX "regulation_versions_label_idx" ON "regulation_versions" USING btree ("regulation_id","version_label");--> statement-breakpoint
CREATE UNIQUE INDEX "regulations_code_idx" ON "regulations" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "regulatory_datasets_code_idx" ON "regulatory_datasets" USING btree ("code");--> statement-breakpoint
CREATE INDEX "regulatory_datasets_regulation_status_idx" ON "regulatory_datasets" USING btree ("regulation_id","status");--> statement-breakpoint
CREATE INDEX "requirements_dataset_category_idx" ON "requirements" USING btree ("dataset_id","product_category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "standard_versions_label_idx" ON "standard_versions" USING btree ("standard_id","version_label");--> statement-breakpoint
CREATE UNIQUE INDEX "standards_code_idx" ON "standards" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "tests_code_idx" ON "tests" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "regulatory_datasets_one_published_per_regulation_idx" ON "regulatory_datasets" ("regulation_id") WHERE "status" = 'published';
