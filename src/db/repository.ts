import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { type ProductCategoryTranslationInput } from "../domain/product-category-translations";
import {
  auditEvents,
  certificateRevisions,
  certificates,
  productCategories,
  productCategoryTranslations,
} from "./schema";

export type ProductCategoryWithTranslations = {
  id: string;
  code: string;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  translations: ProductCategoryTranslationInput[];
};

export type AuditEventSummary = {
  id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  requestId: string;
  createdAt: Date;
};

export type CertificateRecord = {
  id: string;
  certificateNumber: string;
  status: string;
  version: number;
  revisionNumber: number;
  productCategoryId: string;
  productCategoryCode: string;
  productName: string;
  productModel: string | null;
  manufacturer: string;
  applicant: string | null;
  regulationCode: string;
  certificationScheme: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  createdByEmail: string;
  createdAt: Date;
};

function groupCategoryRows(
  rows: Array<{
    category: typeof productCategories.$inferSelect;
    translation: typeof productCategoryTranslations.$inferSelect | null;
  }>,
) {
  const categories = new Map<string, ProductCategoryWithTranslations>();

  for (const row of rows) {
    const existing = categories.get(row.category.id);
    const category = existing ?? {
      ...row.category,
      translations: [],
    };

    if (row.translation) category.translations.push(row.translation);
    categories.set(row.category.id, category);
  }

  return [...categories.values()];
}

export async function listActiveProductCategories(connectionString: string) {
  const client = new Client({ connectionString });

  await client.connect();

  try {
    const db = drizzle(client);

    const categories = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.status, "active"))
      .orderBy(asc(productCategories.code))
      .limit(100);
    if (categories.length === 0) return [];

    const translations = await db
      .select()
      .from(productCategoryTranslations)
      .where(
        inArray(
          productCategoryTranslations.productCategoryId,
          categories.map((category) => category.id),
        ),
      )
      .orderBy(asc(productCategoryTranslations.locale));

    return categories.map((category) => ({
      ...category,
      translations: translations.filter(
        (translation) => translation.productCategoryId === category.id,
      ),
    }));
  } finally {
    await client.end();
  }
}

export async function getProductCategory(connectionString: string, id: string) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    const rows = await db
      .select()
      .from(productCategories)
      .leftJoin(
        productCategoryTranslations,
        eq(productCategories.id, productCategoryTranslations.productCategoryId),
      )
      .where(eq(productCategories.id, id))
      .orderBy(asc(productCategoryTranslations.locale));

    return (
      groupCategoryRows(
        rows.map((row) => ({
          category: row.product_categories,
          translation: row.product_category_translations,
        })),
      )[0] ?? null
    );
  } finally {
    await client.end();
  }
}

export async function listRecentAuditEvents(connectionString: string, limit = 50) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);

    return await db
      .select({
        id: auditEvents.id,
        actorEmail: auditEvents.actorEmail,
        action: auditEvents.action,
        entityType: auditEvents.entityType,
        entityId: auditEvents.entityId,
        requestId: auditEvents.requestId,
        createdAt: auditEvents.createdAt,
      })
      .from(auditEvents)
      .orderBy(desc(auditEvents.createdAt))
      .limit(Math.min(Math.max(limit, 1), 100));
  } finally {
    await client.end();
  }
}

export async function listCertificates(connectionString: string, limit = 100) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);

    return await db
      .select({
        id: certificates.id,
        certificateNumber: certificates.certificateNumber,
        status: certificates.status,
        version: certificates.version,
        revisionNumber: certificateRevisions.revisionNumber,
        productCategoryId: certificateRevisions.productCategoryId,
        productCategoryCode: productCategories.code,
        productName: certificateRevisions.productName,
        productModel: certificateRevisions.productModel,
        manufacturer: certificateRevisions.manufacturer,
        applicant: certificateRevisions.applicant,
        regulationCode: certificateRevisions.regulationCode,
        certificationScheme: certificateRevisions.certificationScheme,
        issuedAt: certificateRevisions.issuedAt,
        expiresAt: certificateRevisions.expiresAt,
        createdByEmail: certificateRevisions.createdByEmail,
        createdAt: certificateRevisions.createdAt,
      })
      .from(certificates)
      .innerJoin(
        certificateRevisions,
        eq(certificates.id, certificateRevisions.certificateId),
      )
      .innerJoin(
        productCategories,
        eq(certificateRevisions.productCategoryId, productCategories.id),
      )
      .where(eq(certificates.status, "active"))
      .orderBy(desc(certificateRevisions.createdAt))
      .limit(Math.min(Math.max(limit, 1), 100));
  } finally {
    await client.end();
  }
}

export async function createCertificate(
  connectionString: string,
  input: {
    certificateNumber: string;
    productCategoryId: string;
    productName: string;
    productModel?: string | null;
    manufacturer: string;
    applicant?: string | null;
    regulationCode: string;
    certificationScheme?: string | null;
    issuedAt?: string | null;
    expiresAt?: string | null;
    actorEmail: string;
    requestId: string;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);

    return await db.transaction(async (tx) => {
      const [certificate] = await tx
        .insert(certificates)
        .values({ certificateNumber: input.certificateNumber })
        .returning();

      const [revision] = await tx
        .insert(certificateRevisions)
        .values({
          certificateId: certificate.id,
          revisionNumber: 1,
          productCategoryId: input.productCategoryId,
          productName: input.productName,
          productModel: input.productModel ?? null,
          manufacturer: input.manufacturer,
          applicant: input.applicant ?? null,
          regulationCode: input.regulationCode,
          certificationScheme: input.certificationScheme ?? null,
          issuedAt: input.issuedAt ?? null,
          expiresAt: input.expiresAt ?? null,
          createdByEmail: input.actorEmail,
        })
        .returning();

      const after = { certificate, revision };

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "create",
        entityType: "certificate",
        entityId: certificate.id,
        requestId: input.requestId,
        beforeJson: null,
        afterJson: after,
      });

      return after;
    });
  } finally {
    await client.end();
  }
}

export async function updateProductCategory(
  connectionString: string,
  input: {
    id: string;
    version: number;
    translations: ProductCategoryTranslationInput[];
    actorEmail: string;
    requestId: string;
    reason?: string | null;
  },
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);

    return await db.transaction(async (tx) => {
      const beforeRows = await tx
        .select()
        .from(productCategories)
        .leftJoin(
          productCategoryTranslations,
          eq(productCategories.id, productCategoryTranslations.productCategoryId),
        )
        .where(eq(productCategories.id, input.id))
        .orderBy(asc(productCategoryTranslations.locale));
      const before = groupCategoryRows(
        beforeRows.map((row) => ({
          category: row.product_categories,
          translation: row.product_category_translations,
        })),
      )[0];

      if (!before) return null;

      const updated = await tx
        .update(productCategories)
        .set({
          version: sql`${productCategories.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(productCategories.id, input.id),
            eq(productCategories.version, input.version),
          ),
        )
        .returning();

      if (!updated[0]) return null;

      await tx
        .delete(productCategoryTranslations)
        .where(eq(productCategoryTranslations.productCategoryId, input.id));

      await tx.insert(productCategoryTranslations).values(
        input.translations.map((translation) => ({
          productCategoryId: input.id,
          ...translation,
        })),
      );

      const after = {
        ...updated[0],
        translations: input.translations,
      };

      await tx.insert(auditEvents).values({
        actorEmail: input.actorEmail,
        action: "update",
        entityType: "product_category",
        entityId: input.id,
        requestId: input.requestId,
        reason: input.reason ?? null,
        beforeJson: before,
        afterJson: after,
      });

      return after;
    });
  } finally {
    await client.end();
  }
}
