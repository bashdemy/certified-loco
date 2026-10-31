import { describe, expect, it } from "vitest";
import {
  computeAssessment,
  diffParameters,
  isEffectiveOnDate,
  normalizeTestParameters,
  type AssessmentEngineInput,
  type CurrentRequirementInput,
} from "../../src/domain/assessment-engine";

function makeRequirement(
  overrides: Partial<CurrentRequirementInput> = {},
): CurrentRequirementInput {
  return {
    id: "req-1",
    productCategoryId: "cat-loco",
    productCategoryCode: "wheelset_locomotive",
    productCategoryName: "Locomotive wheelsets",
    regulationCode: "ТР ТС 001/2011",
    regulationVersionId: "reg-ver-1",
    regulationVersionLabel: "Decision No. 710 (2011-07-15)",
    regulationEffectiveFrom: "2014-08-02",
    regulationEffectiveTo: null,
    provision: "Article 4, Section 12",
    standardCode: "ГОСТ 11018-2011",
    standardVersionId: "std-ver-1",
    standardVersionLabel: "2011",
    standardEffectiveFrom: "2012-07-01",
    standardEffectiveTo: null,
    standardClause: "Clause 5.2.4",
    testId: "test-1",
    testCode: "wheelset_ultrasonic_axle",
    testName: "Ultrasonic flaw detection of axle",
    testStatus: "active",
    parameters: { sensitivityMm2: 2, coveragePercent: 100 },
    effectiveFrom: "2020-01-01",
    effectiveTo: null,
    sourceReference: "ТР ТС 001/2011 Official Register",
    sourcePageSection: "Annex 1, p. 18",
    extractionMethod: "manual",
    reviewStatus: "approved",
    ...overrides,
  };
}

function makeBaseInput(): AssessmentEngineInput {
  return {
    assessmentDate: "2026-10-31",
    certificate: {
      certificateId: "cert-1",
      certificateNumber: "KZ.7500001.01.01.00101",
      certificateRevisionId: "rev-1",
      revisionNumber: 1,
      confirmedAt: "2026-10-01T00:00:00.000Z",
      productCategoryId: "cat-loco",
      productCategoryCode: "wheelset_locomotive",
      productCategoryName: "Locomotive wheelsets",
      productCategoryStatus: "active",
      productCategoryVersion: 1,
      productName: "Locomotive Wheelset KP-2M",
      manufacturer: "PromMash Komplekt LLP",
      regulationCode: "ТР ТС 001/2011",
      historicalTests: [
        {
          id: "hist-1",
          testId: "test-1",
          testCode: "wheelset_ultrasonic_axle",
          testName: "Ultrasonic flaw detection of axle",
          standardVersionId: "std-ver-1",
          standardCode: "ГОСТ 11018-2011",
          standardVersionLabel: "2011",
          standardClause: "Clause 5.2.4",
          parameters: { coveragePercent: 100, sensitivityMm2: 2 },
          protocolNumber: "PR-2022-014",
          sourcePageSection: "p. 2",
        },
        {
          id: "hist-2",
          testId: "test-2",
          testCode: "wheelset_press_fit_force",
          testName: "Wheel-to-axle press-fit force control",
          standardVersionId: "std-ver-1",
          standardCode: "ГОСТ 11018-2011",
          standardVersionLabel: "2011",
          standardClause: "Clause 4.3.2",
          parameters: { minForceKnPerMm: 4.0, sampleCount: 1 },
          protocolNumber: "PR-2022-014",
          sourcePageSection: "p. 3",
        },
        {
          id: "hist-3",
          testId: "test-3",
          testCode: "wheelset_hardness_rim",
          testName: "Wheel rim Brinell hardness check",
          standardVersionId: "std-ver-1",
          standardCode: "ГОСТ 11018-2011",
          standardVersionLabel: "2011",
          standardClause: "Clause 4.2.1",
          parameters: { minHB: 255 },
          protocolNumber: "PR-2022-014",
          sourcePageSection: "p. 4",
        },
      ],
    },
    publishedDatasets: [
      {
        id: "ds-1",
        code: "tr-ts-001-2011-wheelsets-v1",
        title: "Wheelsets v1",
        regulationCode: "ТР ТС 001/2011",
        datasetVersion: 1,
        status: "published",
        effectiveFrom: "2020-01-01",
        effectiveTo: null,
        publishedAt: "2026-01-01T00:00:00.000Z",
        requirements: [
          makeRequirement({
            id: "req-1",
            testId: "test-1",
            testCode: "wheelset_ultrasonic_axle",
            testName: "Ultrasonic flaw detection of axle",
            standardClause: "Clause 5.2.4",
            parameters: { sensitivityMm2: 2, coveragePercent: 100 },
          }),
          makeRequirement({
            id: "req-2",
            testId: "test-2",
            testCode: "wheelset_press_fit_force",
            testName: "Wheel-to-axle press-fit force control",
            standardClause: "Clause 4.3.2",
            parameters: { minForceKnPerMm: 4.5, sampleCount: 1 },
          }),
          makeRequirement({
            id: "req-3",
            testId: "test-4",
            testCode: "wheelset_impact_bending_cold",
            testName: "Low-temperature impact toughness (KCU)",
            standardClause: "Clause 5.1.8",
            parameters: { temperatureC: -40, sampleCount: 3 },
          }),
        ],
      },
    ],
  };
}

describe("assessment engine rules", () => {
  it("evaluates effective-date boundaries inclusively", () => {
    expect(isEffectiveOnDate("2020-01-01", null, "2020-01-01")).toBe(true);
    expect(isEffectiveOnDate("2020-01-01", "2025-12-31", "2025-12-31")).toBe(true);
    expect(isEffectiveOnDate("2020-01-01", "2025-12-31", "2019-12-31")).toBe(false);
    expect(isEffectiveOnDate("2020-01-01", "2025-12-31", "2026-01-01")).toBe(false);
  });

  it("normalizes parameters deterministically regardless of key order", () => {
    const a = normalizeTestParameters({ b: 2, a: "  hello  ", empty: "" });
    const b = normalizeTestParameters({ a: "hello", b: 2 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(diffParameters(a, b)).toEqual([]);
  });

  it("computes required, additional, changed, and historical_only states with full provenance", () => {
    const input = makeBaseInput();
    const assessment = computeAssessment(input);

    expect(assessment.overallStatus).toBe("ready");
    expect(assessment.selectedDatasetId).toBe("ds-1");
    expect(assessment.summaryCounts).toEqual({
      required: 1,
      additional: 1,
      changed: 1,
      historical_only: 1,
      review: 0,
    });

    const byCode = new Map(assessment.results.map((r) => [r.testCode, r]));
    expect(byCode.get("wheelset_ultrasonic_axle")?.state).toBe("required");
    expect(byCode.get("wheelset_press_fit_force")?.state).toBe("changed");
    expect(byCode.get("wheelset_impact_bending_cold")?.state).toBe("additional");
    expect(byCode.get("wheelset_hardness_rim")?.state).toBe("historical_only");

    // Every non-review requirement result has complete provenance chain
    for (const item of assessment.results) {
      if (item.state !== "historical_only" && item.state !== "review") {
        expect(item.provenance).not.toBeNull();
        expect(item.provenance?.regulationCode).toBe("ТР ТС 001/2011");
        expect(item.provenance?.standardCode).toBe("ГОСТ 11018-2011");
        expect(item.provenance?.sourceReference).toBeTruthy();
        expect(item.provenance?.sourcePageSection).toBeTruthy();
      }
    }
  });

  it("produces identical results for identical immutable inputs", () => {
    const first = computeAssessment(makeBaseInput());
    const second = computeAssessment(makeBaseInput());
    expect(first).toEqual(second);
  });

  it("returns review when certificate revision is not confirmed", () => {
    const input = makeBaseInput();
    input.certificate.confirmedAt = null;
    const assessment = computeAssessment(input);
    expect(assessment.overallStatus).toBe("review");
    expect(assessment.summaryCounts.review).toBe(1);
  });

  it("returns review when no published dataset matches the assessment date", () => {
    const input = makeBaseInput();
    input.assessmentDate = "2015-01-01";
    const assessment = computeAssessment(input);
    expect(assessment.overallStatus).toBe("review");
    expect(assessment.selectedDatasetId).toBeNull();
  });

  it("returns review when a requirement lacks approved evidence", () => {
    const input = makeBaseInput();
    input.publishedDatasets[0].requirements[0].reviewStatus = "pending_review";
    const assessment = computeAssessment(input);
    expect(assessment.overallStatus).toBe("review");
    expect(assessment.summaryCounts.review).toBe(1);
  });
});
