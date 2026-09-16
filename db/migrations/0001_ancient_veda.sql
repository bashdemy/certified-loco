CREATE TABLE "product_category_translations" (
	"product_category_id" uuid NOT NULL,
	"locale" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	CONSTRAINT "product_category_translations_product_category_id_locale_pk" PRIMARY KEY("product_category_id","locale")
);
--> statement-breakpoint
ALTER TABLE "product_category_translations" ADD CONSTRAINT "product_category_translations_product_category_id_product_categories_id_fk" FOREIGN KEY ("product_category_id") REFERENCES "public"."product_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "product_category_translations" ("product_category_id", "locale", "name", "description")
SELECT "id", 'en', "name_en", "description" FROM "product_categories"
UNION ALL
SELECT "id", 'ru', "name_ru", NULL FROM "product_categories"
UNION ALL
SELECT "id", 'kk', "name_kk", NULL FROM "product_categories";--> statement-breakpoint
ALTER TABLE "product_categories" DROP COLUMN "name_ru";--> statement-breakpoint
ALTER TABLE "product_categories" DROP COLUMN "name_kk";--> statement-breakpoint
ALTER TABLE "product_categories" DROP COLUMN "name_en";--> statement-breakpoint
ALTER TABLE "product_categories" DROP COLUMN "description";
