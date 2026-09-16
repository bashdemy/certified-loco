CREATE TABLE "certificate_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"product_category_id" uuid NOT NULL,
	"product_name" varchar(500) NOT NULL,
	"product_model" varchar(255),
	"manufacturer" varchar(500) NOT NULL,
	"applicant" varchar(500),
	"regulation_code" varchar(100) NOT NULL,
	"certification_scheme" varchar(100),
	"issued_at" date,
	"expires_at" date,
	"created_by_email" varchar(320) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_number" varchar(150) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certificate_revisions" ADD CONSTRAINT "certificate_revisions_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_revisions" ADD CONSTRAINT "certificate_revisions_product_category_id_product_categories_id_fk" FOREIGN KEY ("product_category_id") REFERENCES "public"."product_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "certificate_revisions_number_idx" ON "certificate_revisions" USING btree ("certificate_id","revision_number");--> statement-breakpoint
CREATE INDEX "certificate_revisions_category_idx" ON "certificate_revisions" USING btree ("product_category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_number_idx" ON "certificates" USING btree ("certificate_number");