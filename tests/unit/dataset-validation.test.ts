import { describe, expect, it } from "vitest";
import {
  validateDatasetForPublish,
  type DatasetPublishValidationCandidate,
} from "../../src/domain/dataset-validation";

function makeValidCandidate(): DatasetPublishValidationCandidate {
  return {
    id: "ds-1",
    code: "tr-ts-001-2011-wheelsets-v1",
    status: "draft",
    effectiveFrom: "2020-01-01",
    effectiveTo: null,
    reason: "Approved by domain reviewer after checking Annex 1.",
    requirements: [
      {
        id: "req-1",
        productCategoryCode: "wheelset_locomotive",
        productCategoryStatus: "active",
        regulationCode: "ТР ТС 001/2011",
        regulationStatus: "active",
        regulationVersionLabel: "Decision No. 710",
        regulationVersionStatus: "active",
        provision: "Article 4",
        standardCode: "ГОСТ 11018-2011",
        standardStatus: "active",
        standardVersionLabel: "2011",
        standardVersionStatus: "active",
        standardClause: "Clause 5.2.4",
        testCode: "wheelset_ultrasonic_axle",
        testStatus: "active",
        effectiveFrom: "2020-01-01",
        effectiveTo: null,
        sourceReference: "Official Register",
        sourcePageSection: "p. 18",
        reviewStatus: "approved",
      },
    ],
  };
}

describe("regulatory dataset publish validation", () => {
  it("accepts a valid draft dataset with approved requirements and reason", () => {
    const result = validateDatasetForPublish(makeValidCandidate());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects publishing without a review reason", () => {
    const candidate = makeValidCandidate();
    candidate.reason = "   ";
    const result = validateDatasetForPublish(candidate);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("reason is required"))).toBe(true);
  });

  it("rejects publishing when any requirement is pending_review or missing provenance", () => {
    const candidate = makeValidCandidate();
    candidate.requirements[0].reviewStatus = "pending_review";
    candidate.requirements[0].sourcePageSection = "";
    const result = validateDatasetForPublish(candidate);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("rejects publishing an already published or superseded dataset", () => {
    const candidate = makeValidCandidate();
    candidate.status = "published";
    const result = validateDatasetForPublish(candidate);
    expect(result.valid).toBe(false);
  });
});
