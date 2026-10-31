CREATE TABLE "app_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot" varchar(50) NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"role" varchar(20) DEFAULT 'admin' NOT NULL,
	"password_hash" varchar(500) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "app_users_slot_idx" ON "app_users" USING btree ("slot");--> statement-breakpoint
CREATE UNIQUE INDEX "app_users_email_idx" ON "app_users" USING btree ("email");