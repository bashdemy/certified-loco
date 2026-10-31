import { isIsoDate } from "./assessment-engine";

export type DatasetRequirementValidationCandidate = {
  id: string;
  productCategoryCode: string;
  productCategoryStatus: string;
  regulationCode: string;
  regulationStatus: string;
  regulationVersionLabel: string;
  regulationVersionStatus: string;
  provision: string;
  standardCode: string;
  standardStatus: string;
  standardVersionLabel: string;
  standardVersionStatus: string;
  standardClause: string;
  testCode: string;
  testStatus: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  sourceReference: string;
  sourcePageSection: string;
  reviewStatus: string;
};

export type DatasetPublishValidationCandidate = {
  id: string;
  code: string;
  status: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  reason: string | null | undefined;
  requirements: DatasetRequirementValidationCandidate[];
};

export type DatasetPublishValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateDatasetForPublish(
  dataset: DatasetPublishValidationCandidate,
): DatasetPublishValidationResult {
  const errors: string[] = [];

  if (dataset.status !== "draft" && dataset.status !== "review") {
    errors.push(
      `Dataset '${dataset.code}' has status '${dataset.status}'; only 'draft' or 'review' datasets can be published.`,
    );
  }

  if (!dataset.reason || !dataset.reason.trim()) {
    errors.push("A review reason is required to publish a regulatory dataset.");
  }

  if (!isIsoDate(dataset.effectiveFrom)) {
    errors.push("Dataset effectiveFrom date is invalid.");
  }

  if (dataset.effectiveTo !== null && !isIsoDate(dataset.effectiveTo)) {
    errors.push("Dataset effectiveTo date is invalid.");
  }

  if (
    dataset.effectiveTo !== null &&
    isIsoDate(dataset.effectiveFrom) &&
    isIsoDate(dataset.effectiveTo) &&
    dataset.effectiveTo < dataset.effectiveFrom
  ) {
    errors.push("Dataset effectiveTo date cannot precede effectiveFrom.");
  }

  if (dataset.requirements.length === 0) {
    errors.push("Dataset must contain at least one requirement before publishing.");
  }

  for (const req of dataset.requirements) {
    if (req.reviewStatus !== "approved") {
      errors.push(
        `Requirement '${req.id}' (${req.testCode}) has reviewStatus '${req.reviewStatus}'; all requirements must be 'approved'.`,
      );
    }
    if (req.productCategoryStatus !== "active") {
      errors.push(
        `Requirement '${req.id}' references non-active product category '${req.productCategoryCode}'.`,
      );
    }
    if (req.regulationStatus !== "active" || req.regulationVersionStatus !== "active") {
      errors.push(
        `Requirement '${req.id}' references non-active regulation or version '${req.regulationCode} (${req.regulationVersionLabel})'.`,
      );
    }
    if (req.standardStatus !== "active" || req.standardVersionStatus !== "active") {
      errors.push(
        `Requirement '${req.id}' references non-active standard or version '${req.standardCode} (${req.standardVersionLabel})'.`,
      );
    }
    if (req.testStatus !== "active") {
      errors.push(
        `Requirement '${req.id}' references non-active test '${req.testCode}'.`,
      );
    }
    if (!req.provision.trim()) {
      errors.push(`Requirement '${req.id}' is missing a regulatory provision.`);
    }
    if (!req.standardClause.trim()) {
      errors.push(`Requirement '${req.id}' is missing a standard clause.`);
    }
    if (!req.sourceReference.trim() || !req.sourcePageSection.trim()) {
      errors.push(
        `Requirement '${req.id}' is missing source document/reference or page/section/clause provenance.`,
      );
    }
    if (!isIsoDate(req.effectiveFrom)) {
      errors.push(`Requirement '${req.id}' has an invalid effectiveFrom date.`);
    }
    if (req.effectiveTo !== null && !isIsoDate(req.effectiveTo)) {
      errors.push(`Requirement '${req.id}' has an invalid effectiveTo date.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
