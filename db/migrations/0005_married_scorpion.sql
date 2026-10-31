CREATE TABLE "certificate_revision_documents" (
	"certificate_revision_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	CONSTRAINT "certificate_revision_documents_certificate_revision_id_document_id_pk" PRIMARY KEY("certificate_revision_id","document_id")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"original_filename" varchar(500) NOT NULL,
	"content_type" varchar(150) NOT NULL,
	"size_bytes" integer,
	"sha256" varchar(64) NOT NULL,
	"created_by_email" varchar(320) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certificate_revision_documents" ADD CONSTRAINT "certificate_revision_documents_certificate_revision_id_certificate_revisions_id_fk" FOREIGN KEY ("certificate_revision_id") REFERENCES "public"."certificate_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_revision_documents" ADD CONSTRAINT "certificate_revision_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "certificate_revision_documents_document_idx" ON "certificate_revision_documents" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_storage_key_idx" ON "documents" USING btree ("storage_key");