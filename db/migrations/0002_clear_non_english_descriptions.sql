UPDATE "product_category_translations"
SET "description" = NULL
WHERE "locale" IN ('ru', 'kk')
  AND "description" = 'Development catalogue record for the first assessment slice.';
