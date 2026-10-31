import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import {
  addTestToCertificateRevision,
  createCertificate,
  listAssessments,
  listCertificates,
  listRegulatoryDatasets,
  publishRegulatoryDataset,
  reviewRequirement,
  runAssessment,
} from "./repository";
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
    descriptions: {
      en: "Traction rolling stock wheelsets for 1520 mm gauge railways subject to mandatory certification under ТР ТС 001/2011 (Annex 1, item 10) and ГОСТ 11018-2011.",
      ru: "Колесные пары тягового подвижного состава колеи 1520 мм, подлежащие обязательной сертификации по ТР ТС 001/2011 (Приложение № 1, п. 10) и ГОСТ 11018-2011.",
      kk: "КО ТР 001/2011 (№ 1 қосымша, 10-т.) және МЕМСТ 11018-2011 бойынша міндетті сертификаттауға жататын 1520 мм табанды локомотив дөңгелек жұптары.",
    },
  },
  {
    code: "wheelset_wagon",
    translations: {
      en: "Wagon wheelsets",
      ru: "Колесные пары вагонов",
      kk: "Вагондардың дөңгелек жұптары",
    },
    descriptions: {
      en: "Mainline freight and passenger wagon wheelsets (1520 mm gauge) subject to mandatory certification under ТР ТС 001/2011 (Annex 1, item 11) and ГОСТ 4835-2013.",
      ru: "Колесные пары грузовых и пассажирских вагонов магистральных железных дорог колеи 1520 мм по ТР ТС 001/2011 (Приложение № 1, п. 11) и ГОСТ 4835-2013.",
      kk: "КО ТР 001/2011 (№ 1 қосымша, 11-т.) және МЕМСТ 4835-2013 бойынша міндетті сертификаттауға жататын магистральдық вагондардың дөңгелек жұптары.",
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

      for (const category of developmentCategories) {
        const productCategoryId = categoryIds.get(category.code);
        if (!productCategoryId) throw new Error(`Missing category ${category.code}`);

        for (const [locale, name] of Object.entries(category.translations)) {
          const description =
            category.descriptions[locale as keyof typeof category.descriptions] ?? null;
          await tx
            .insert(productCategoryTranslations)
            .values({
              productCategoryId,
              locale,
              name,
              description,
            })
            .onConflictDoUpdate({
              target: [
                productCategoryTranslations.productCategoryId,
                productCategoryTranslations.locale,
              ],
              set: {
                name,
                description,
              },
            });
        }
      }

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

export async function prepareProductionDemoData(connectionString: string) {
  const datasets = await listRegulatoryDatasets(connectionString, {
    includeNonPublished: true,
  });
  const baseline = datasets.find((d) => d.code === "tr-ts-001-2011-wheelsets-v1");
  if (baseline && baseline.status === "draft") {
    for (const req of baseline.requirements) {
      if (req.reviewStatus !== "approved") {
        await reviewRequirement(connectionString, {
          requirementId: req.id,
          reviewStatus: "approved",
          reason: "Verified against ТР ТС 001/2011 & ГОСТ 11018-2011 / ГОСТ 4835-2013",
          actorEmail: "bashdemy@gmail.com",
          requestId: "seed-approve",
        });
      }
    }
    await publishRegulatoryDataset(connectionString, {
      datasetId: baseline.id,
      reason: "Initial publication of mandatory RK & EAEU railway wheelset requirements",
      actorEmail: "bashdemy@gmail.com",
      requestId: "seed-publish",
    });
  }

  const certs = await listCertificates(connectionString);
  const wagonCertNo = "ЕАЭС KZ.7100001.21.01.00204";
  if (!certs.some((c) => c.certificateNumber === wagonCertNo)) {
    const client = new Client({ connectionString });
    await client.connect();
    try {
      const db = drizzle(client);
      const [wagonCat] = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.code, "wheelset_wagon"));
      const [gost4835] = await db
        .select()
        .from(standards)
        .where(eq(standards.code, "ГОСТ 4835-2013"));
      const [gost4835Ver] = gost4835
        ? await db
            .select()
            .from(standardVersions)
            .where(
              and(
                eq(standardVersions.standardId, gost4835.id),
                eq(standardVersions.versionLabel, "2013"),
              ),
            )
        : [];
      const [ultrasonic] = await db
        .select()
        .from(tests)
        .where(eq(tests.code, "wheelset_ultrasonic_axle"));

      if (wagonCat && gost4835Ver && ultrasonic) {
        const createdWagonCert = await createCertificate(connectionString, {
          certificateNumber: wagonCertNo,
          productCategoryId: wagonCat.id,
          productName: "Wagon Wheelset RU1Sh-957-G",
          productModel: "РУ1Ш-957-Г",
          manufacturer: "ZIKSTO JSC",
          applicant: "Kamkor Wagon LLP",
          regulationCode: "ТР ТС 001/2011",
          certificationScheme: "3c",
          issuedAt: "2023-03-15",
          expiresAt: "2028-03-14",
          confirmed: true,
          actorEmail: "bashdemy@gmail.com",
          requestId: "seed-wagon-cert",
        });

        await addTestToCertificateRevision(connectionString, {
          certificateRevisionId: createdWagonCert.revision.id,
          testId: ultrasonic.id,
          standardVersionId: gost4835Ver.id,
          standardClause: "Clause 5.3.1",
          parameters: { sensitivityMm2: 2, coveragePercent: 100 },
          protocolNumber: "ИЛ-2023-089",
          sourcePageSection: "Protocol ИЛ-2023-089, p. 2",
          actorEmail: "bashdemy@gmail.com",
          requestId: "seed-wagon-test",
        });
      }
    } finally {
      await client.end();
    }
  }

  const existingAssessments = await listAssessments(connectionString);
  if (existingAssessments.length === 0) {
    const allCerts = await listCertificates(connectionString);
    for (const cert of allCerts) {
      await runAssessment(connectionString, {
        certificateRevisionId: cert.revisionId,
        assessmentDate: "2026-10-31",
        actorEmail: "bashdemy@gmail.com",
        requestId: `seed-assessment-${cert.certificateNumber}`,
      });
    }
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
  seedDatabase(connectionString)
    .then(() => prepareProductionDemoData(connectionString))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
