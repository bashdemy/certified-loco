import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import {
  appUsers,
  certificateRevisions,
  certificateRevisionTests,
  certificates,
  productCategories,
  productCategoryTranslations,
  regulations,
  regulationVersions,
  regulatoryDatasets,
  requirements,
  standards,
  standardVersions,
  tests,
} from "./schema";
import { hashPassword } from "../infrastructure/auth/cloudflare-access";

const developmentCategories = [
  {
    code: "wheelset_locomotive",
    translations: {
      en: "Locomotive wheelsets",
      ru: "Колесные пары локомотивов",
      kk: "Локомотивтердің дөңгелек жұптары",
    },
  },
  {
    code: "wheelset_wagon",
    translations: {
      en: "Wagon wheelsets",
      ru: "Колесные пары вагонов",
      kk: "Вагондардың дөңгелек жұптары",
    },
  },
];

type RegulatoryFixture = {
  regulation: {
    code: string;
    name: string;
    version: {
      versionLabel: string;
      effectiveFrom: string;
      effectiveTo: string | null;
    };
  };
  standards: Array<{
    code: string;
    name: string;
    version: {
      versionLabel: string;
      effectiveFrom: string;
      effectiveTo: string | null;
    };
  }>;
  tests: Array<{
    code: string;
    name: string;
    method: string;
    unit: string;
    defaultParameters: Record<string, unknown>;
  }>;
  dataset: {
    code: string;
    title: string;
    datasetVersion: number;
    effectiveFrom: string;
    effectiveTo: string | null;
    requirements: Array<{
      productCategoryCode: string;
      provision: string;
      standardCode: string;
      standardVersionLabel: string;
      standardClause: string;
      testCode: string;
      parameters: Record<string, unknown>;
      effectiveFrom: string;
      effectiveTo: string | null;
      sourceReference: string;
      sourcePageSection: string;
      extractionMethod: string;
    }>;
  };
};

export async function seedDatabase(connectionString: string) {
  const fixturePath = path.resolve(
    process.cwd(),
    "data/regulatory/tr-ts-001-2011-wheelsets.json",
  );
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as RegulatoryFixture;

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);

    await db.transaction(async (tx) => {
      await tx
        .insert(productCategories)
        .values(developmentCategories.map(({ code }) => ({ code })))
        .onConflictDoNothing({ target: productCategories.code });

      const categories = await tx.select().from(productCategories);
      const categoryIds = new Map(
        categories.map((category) => [category.code, category.id]),
      );

      await tx
        .insert(productCategoryTranslations)
        .values(
          developmentCategories.flatMap((category) => {
            const productCategoryId = categoryIds.get(category.code);
            if (!productCategoryId) throw new Error(`Missing category ${category.code}`);

            return Object.entries(category.translations).map(([locale, name]) => ({
              productCategoryId,
              locale,
              name,
              description:
                locale === "en"
                  ? "Development catalogue record for the first assessment slice."
                  : null,
            }));
          }),
        )
        .onConflictDoNothing();

      await tx
        .insert(regulations)
        .values({
          code: fixture.regulation.code,
          name: fixture.regulation.name,
        })
        .onConflictDoNothing({ target: regulations.code });

      const [regRow] = await tx
        .select()
        .from(regulations)
        .where(eq(regulations.code, fixture.regulation.code));

      await tx
        .insert(regulationVersions)
        .values({
          regulationId: regRow.id,
          versionLabel: fixture.regulation.version.versionLabel,
          effectiveFrom: fixture.regulation.version.effectiveFrom,
          effectiveTo: fixture.regulation.version.effectiveTo,
        })
        .onConflictDoNothing();

      const [regVersionRow] = await tx
        .select()
        .from(regulationVersions)
        .where(eq(regulationVersions.regulationId, regRow.id));

      for (const std of fixture.standards) {
        await tx
          .insert(standards)
          .values({
            code: std.code,
            name: std.name,
          })
          .onConflictDoNothing({ target: standards.code });

        const [stdRow] = await tx
          .select()
          .from(standards)
          .where(eq(standards.code, std.code));

        await tx
          .insert(standardVersions)
          .values({
            standardId: stdRow.id,
            versionLabel: std.version.versionLabel,
            effectiveFrom: std.version.effectiveFrom,
            effectiveTo: std.version.effectiveTo,
          })
          .onConflictDoNothing();
      }

      const allStandards = await tx.select().from(standards);
      const allStandardVersions = await tx.select().from(standardVersions);
      const standardVersionByKey = new Map<string, string>();
      for (const sv of allStandardVersions) {
        const std = allStandards.find((s) => s.id === sv.standardId);
        if (std) {
          standardVersionByKey.set(`${std.code}:${sv.versionLabel}`, sv.id);
        }
      }

      await tx
        .insert(tests)
        .values([
          ...fixture.tests.map((t) => ({
            code: t.code,
            name: t.name,
            method: t.method,
            unit: t.unit,
            defaultParametersJson: t.defaultParameters,
          })),
          {
            code: "wheelset_hardness_rim",
            name: "Wheel rim Brinell hardness check (historical)",
            method: "Brinell hardness HB",
            unit: "HB",
            defaultParametersJson: { minHB: 255 },
          },
        ])
        .onConflictDoNothing({ target: tests.code });

      const allTests = await tx.select().from(tests);
      const testIdByCode = new Map(allTests.map((t) => [t.code, t.id]));

      const existingDataset = await tx
        .select()
        .from(regulatoryDatasets)
        .where(eq(regulatoryDatasets.code, fixture.dataset.code));

      if (existingDataset.length === 0) {
        const [createdDataset] = await tx
          .insert(regulatoryDatasets)
          .values({
            code: fixture.dataset.code,
            regulationId: regRow.id,
            title: fixture.dataset.title,
            datasetVersion: fixture.dataset.datasetVersion,
            status: "draft",
            effectiveFrom: fixture.dataset.effectiveFrom,
            effectiveTo: fixture.dataset.effectiveTo,
            createdByEmail: "seed@development",
          })
          .returning();

        for (const req of fixture.dataset.requirements) {
          const productCategoryId = categoryIds.get(req.productCategoryCode);
          const standardVersionId = standardVersionByKey.get(
            `${req.standardCode}:${req.standardVersionLabel}`,
          );
          const testId = testIdByCode.get(req.testCode);

          if (!productCategoryId || !standardVersionId || !testId) {
            throw new Error(
              `Missing reference when seeding requirement for ${req.testCode}`,
            );
          }

          await tx.insert(requirements).values({
            datasetId: createdDataset.id,
            productCategoryId,
            regulationVersionId: regVersionRow.id,
            provision: req.provision,
            standardVersionId,
            standardClause: req.standardClause,
            testId,
            parametersJson: req.parameters,
            effectiveFrom: req.effectiveFrom,
            effectiveTo: req.effectiveTo,
            sourceReference: req.sourceReference,
            sourcePageSection: req.sourcePageSection,
            extractionMethod: req.extractionMethod,
            reviewStatus: "pending_review",
          });
        }
      }

      const sampleCertNumber = "KZ.7500001.01.01.00101";
      const existingSampleCert = await tx
        .select()
        .from(certificates)
        .where(eq(certificates.certificateNumber, sampleCertNumber));

      const locoCategoryId = categoryIds.get("wheelset_locomotive");
      const gost11018VersionId = standardVersionByKey.get("ГОСТ 11018-2011:2011");
      const ultrasonicTestId = testIdByCode.get("wheelset_ultrasonic_axle");
      const pressFitTestId = testIdByCode.get("wheelset_press_fit_force");
      const hardnessTestId = testIdByCode.get("wheelset_hardness_rim");

      if (
        existingSampleCert.length === 0 &&
        locoCategoryId &&
        gost11018VersionId &&
        ultrasonicTestId &&
        pressFitTestId &&
        hardnessTestId
      ) {
        const [cert] = await tx
          .insert(certificates)
          .values({ certificateNumber: sampleCertNumber })
          .returning();

        const [rev] = await tx
          .insert(certificateRevisions)
          .values({
            certificateId: cert.id,
            revisionNumber: 1,
            productCategoryId: locoCategoryId,
            productName: "Locomotive Wheelset KP-2M",
            productModel: "KP-2M",
            manufacturer: "PromMash Komplekt LLP",
            applicant: "KazLoco Service LLP",
            regulationCode: "ТР ТС 001/2011",
            certificationScheme: "3c",
            issuedAt: "2022-05-10",
            expiresAt: "2027-05-09",
            confirmedAt: new Date(),
            confirmedByEmail: "seed@development",
            createdByEmail: "seed@development",
          })
          .returning();

        await tx.insert(certificateRevisionTests).values([
          {
            certificateRevisionId: rev.id,
            testId: ultrasonicTestId,
            standardVersionId: gost11018VersionId,
            standardClause: "Clause 5.2.4",
            parametersJson: { sensitivityMm2: 2, coveragePercent: 100 },
            protocolNumber: "PR-2022-014",
            sourcePageSection: "Protocol PR-2022-014, p. 2",
          },
          {
            certificateRevisionId: rev.id,
            testId: pressFitTestId,
            standardVersionId: gost11018VersionId,
            standardClause: "Clause 4.3.2",
            parametersJson: { minForceKnPerMm: 4.0, sampleCount: 1 },
            protocolNumber: "PR-2022-014",
            sourcePageSection: "Protocol PR-2022-014, p. 3",
          },
          {
            certificateRevisionId: rev.id,
            testId: hardnessTestId,
            standardVersionId: gost11018VersionId,
            standardClause: "Clause 4.2.1",
            parametersJson: { minHB: 255 },
            protocolNumber: "PR-2022-014",
            sourcePageSection: "Protocol PR-2022-014, p. 4",
          },
        ]);
      }

      const defaultAccounts = [
        {
          slot: "owner",
          email: (process.env.INITIAL_OWNER_EMAIL ?? "bashdemy@gmail.com").toLowerCase(),
          displayName: "Maria",
          role: "admin",
          password: process.env.INITIAL_OWNER_PASSWORD ?? "CertifiedLoco2026!",
        },
        {
          slot: "dad",
          email: (
            process.env.INITIAL_DAD_EMAIL ?? "dad@certified-loco.local"
          ).toLowerCase(),
          displayName: "Dad",
          role: "admin",
          password: process.env.INITIAL_DAD_PASSWORD ?? "DadLoco2026!",
        },
      ];

      for (const acc of defaultAccounts) {
        const existingUser = await tx
          .select()
          .from(appUsers)
          .where(eq(appUsers.slot, acc.slot));

        if (existingUser.length === 0) {
          const passwordHash = await hashPassword(acc.password);
          await tx.insert(appUsers).values({
            slot: acc.slot,
            email: acc.email,
            displayName: acc.displayName,
            role: acc.role,
            passwordHash,
            isActive: true,
          });
        }
      }
    });

    console.log(
      `Seeded ${developmentCategories.length} product categories, regulation ${fixture.regulation.code}, standards, tests, draft dataset and sample certificate.`,
    );
  } finally {
    await client.end();
  }
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);

if (isMain) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required to seed the database");
    process.exit(1);
  }
  seedDatabase(connectionString).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
