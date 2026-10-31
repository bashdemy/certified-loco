export type AssessmentResultState =
  "required" | "additional" | "changed" | "historical_only" | "review";

export type AssessmentOverallStatus = "ready" | "review";

export type ProvenanceChain = {
  productCategoryCode: string;
  productCategoryName: string;
  regulationCode: string;
  regulationVersionLabel: string;
  provision: string;
  standardCode: string;
  standardVersionLabel: string;
  standardClause: string;
  testCode: string;
  testName: string;
  sourceReference: string;
  sourcePageSection: string;
  extractionMethod: string;
  reviewStatus: string;
};

export type HistoricalTestInput = {
  id: string;
  testId: string;
  testCode: string;
  testName: string;
  standardVersionId: string | null;
  standardCode: string | null;
  standardVersionLabel: string | null;
  standardClause: string | null;
  parameters: Record<string, unknown>;
  protocolNumber: string | null;
  sourcePageSection: string | null;
};

export type CurrentRequirementInput = {
  id: string;
  productCategoryId: string;
  productCategoryCode: string;
  productCategoryName: string;
  regulationCode: string;
  regulationVersionId: string;
  regulationVersionLabel: string;
  regulationEffectiveFrom: string;
  regulationEffectiveTo: string | null;
  provision: string;
  standardCode: string;
  standardVersionId: string;
  standardVersionLabel: string;
  standardEffectiveFrom: string;
  standardEffectiveTo: string | null;
  standardClause: string;
  testId: string;
  testCode: string;
  testName: string;
  testStatus: string;
  parameters: Record<string, unknown>;
  effectiveFrom: string;
  effectiveTo: string | null;
  sourceReference: string;
  sourcePageSection: string;
  extractionMethod: string;
  reviewStatus: string;
};

export type PublishedDatasetInput = {
  id: string;
  code: string;
  title: string;
  regulationCode: string;
  datasetVersion: number;
  status: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  publishedAt: string | null;
  requirements: CurrentRequirementInput[];
};

export type CertificateAssessmentInput = {
  certificateId: string;
  certificateNumber: string;
  certificateRevisionId: string;
  revisionNumber: number;
  confirmedAt: string | null;
  productCategoryId: string;
  productCategoryCode: string;
  productCategoryName: string;
  productCategoryStatus: string;
  productCategoryVersion: number;
  productName: string;
  manufacturer: string;
  regulationCode: string;
  historicalTests: HistoricalTestInput[];
};

export type AssessmentEngineInput = {
  assessmentDate: string;
  certificate: CertificateAssessmentInput;
  publishedDatasets: PublishedDatasetInput[];
};

export type AssessmentItemResult = {
  key: string;
  state: AssessmentResultState;
  testCode: string;
  testName: string;
  reason: string;
  historical: {
    standardCode: string | null;
    standardVersionLabel: string | null;
    standardClause: string | null;
    parameters: Record<string, unknown>;
    protocolNumber: string | null;
    sourcePageSection: string | null;
  } | null;
  current: {
    requirementId: string;
    standardCode: string;
    standardVersionLabel: string;
    standardClause: string;
    parameters: Record<string, unknown>;
  } | null;
  parameterDiffs: string[];
  provenance: ProvenanceChain | null;
};

export type AssessmentSummaryCounts = {
  required: number;
  additional: number;
  changed: number;
  historical_only: number;
  review: number;
};

export type ComputedAssessment = {
  assessmentDate: string;
  overallStatus: AssessmentOverallStatus;
  selectedDatasetId: string | null;
  selectedDatasetCode: string | null;
  selectedDatasetVersion: number | null;
  summaryCounts: AssessmentSummaryCounts;
  results: AssessmentItemResult[];
};

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isEffectiveOnDate(
  effectiveFrom: string,
  effectiveTo: string | null,
  targetDate: string,
): boolean {
  if (!isIsoDate(effectiveFrom) || !isIsoDate(targetDate)) return false;
  if (effectiveTo !== null && !isIsoDate(effectiveTo)) return false;
  if (targetDate < effectiveFrom) return false;
  if (effectiveTo !== null && targetDate > effectiveTo) return false;
  return true;
}

export function normalizeTestParameters(
  raw: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const sortedKeys = Object.keys(raw)
    .map((key) => key.trim())
    .filter(Boolean)
    .sort();

  const normalized: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    const val = raw[key];
    if (val === undefined || val === null || val === "") continue;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed) continue;
      normalized[key] = trimmed;
    } else if (typeof val === "number" || typeof val === "boolean") {
      normalized[key] = val;
    } else {
      normalized[key] = JSON.parse(JSON.stringify(val));
    }
  }
  return normalized;
}

export function diffParameters(
  historicalParams: Record<string, unknown>,
  currentParams: Record<string, unknown>,
): string[] {
  const hist = normalizeTestParameters(historicalParams);
  const curr = normalizeTestParameters(currentParams);
  const keys = [...new Set([...Object.keys(hist), ...Object.keys(curr)])].sort();

  const diffs: string[] = [];
  for (const key of keys) {
    const hVal = hist[key];
    const cVal = curr[key];
    if (JSON.stringify(hVal) !== JSON.stringify(cVal)) {
      diffs.push(
        `${key}: historical=${hVal === undefined ? "none" : JSON.stringify(hVal)}, current=${cVal === undefined ? "none" : JSON.stringify(cVal)}`,
      );
    }
  }
  return diffs;
}

export function hasCompleteApprovedEvidence(
  req: CurrentRequirementInput,
  assessmentDate: string,
): { valid: boolean; reason?: string } {
  if (req.reviewStatus !== "approved") {
    return {
      valid: false,
      reason: `Requirement review status is '${req.reviewStatus}', not 'approved'.`,
    };
  }
  if (req.testStatus !== "active") {
    return {
      valid: false,
      reason: `Test '${req.testCode}' is not active.`,
    };
  }
  if (
    !req.provision.trim() ||
    !req.standardClause.trim() ||
    !req.sourceReference.trim() ||
    !req.sourcePageSection.trim() ||
    !req.regulationCode.trim() ||
    !req.regulationVersionLabel.trim() ||
    !req.standardCode.trim() ||
    !req.standardVersionLabel.trim()
  ) {
    return {
      valid: false,
      reason: "Requirement is missing provenance or source evidence fields.",
    };
  }
  if (
    !isEffectiveOnDate(
      req.regulationEffectiveFrom,
      req.regulationEffectiveTo,
      assessmentDate,
    )
  ) {
    return {
      valid: false,
      reason: `Regulation version '${req.regulationVersionLabel}' is not effective on ${assessmentDate}.`,
    };
  }
  if (
    !isEffectiveOnDate(req.standardEffectiveFrom, req.standardEffectiveTo, assessmentDate)
  ) {
    return {
      valid: false,
      reason: `Standard version '${req.standardCode} (${req.standardVersionLabel})' is not effective on ${assessmentDate}.`,
    };
  }
  return { valid: true };
}

function buildEmptyCounts(): AssessmentSummaryCounts {
  return {
    required: 0,
    additional: 0,
    changed: 0,
    historical_only: 0,
    review: 0,
  };
}

function summarizeCounts(results: AssessmentItemResult[]): AssessmentSummaryCounts {
  const counts = buildEmptyCounts();
  for (const item of results) {
    counts[item.state] += 1;
  }
  return counts;
}

export function computeAssessment(input: AssessmentEngineInput): ComputedAssessment {
  const { assessmentDate, certificate, publishedDatasets } = input;

  if (!isIsoDate(assessmentDate)) {
    const results: AssessmentItemResult[] = [
      {
        key: "invalid_assessment_date",
        state: "review",
        testCode: "unclassified",
        testName: "Assessment date validation",
        reason: "Assessment date is missing or invalid.",
        historical: null,
        current: null,
        parameterDiffs: [],
        provenance: null,
      },
    ];
    return {
      assessmentDate,
      overallStatus: "review",
      selectedDatasetId: null,
      selectedDatasetCode: null,
      selectedDatasetVersion: null,
      summaryCounts: summarizeCounts(results),
      results,
    };
  }

  if (!certificate.confirmedAt) {
    const results: AssessmentItemResult[] = [
      {
        key: "unconfirmed_certificate_revision",
        state: "review",
        testCode: "unclassified",
        testName: "Certificate confirmation check",
        reason:
          "Certificate revision metadata and test programme must be confirmed before deterministic assessment.",
        historical: null,
        current: null,
        parameterDiffs: [],
        provenance: null,
      },
    ];
    return {
      assessmentDate,
      overallStatus: "review",
      selectedDatasetId: null,
      selectedDatasetCode: null,
      selectedDatasetVersion: null,
      summaryCounts: summarizeCounts(results),
      results,
    };
  }

  if (
    !certificate.productCategoryId ||
    !certificate.productCategoryCode ||
    certificate.productCategoryStatus !== "active"
  ) {
    const results: AssessmentItemResult[] = [
      {
        key: "ambiguous_product_category",
        state: "review",
        testCode: "unclassified",
        testName: "Product category classification",
        reason:
          "Product category is missing or inactive; cannot deterministically resolve requirements.",
        historical: null,
        current: null,
        parameterDiffs: [],
        provenance: null,
      },
    ];
    return {
      assessmentDate,
      overallStatus: "review",
      selectedDatasetId: null,
      selectedDatasetCode: null,
      selectedDatasetVersion: null,
      summaryCounts: summarizeCounts(results),
      results,
    };
  }

  const matchingDatasets = publishedDatasets.filter(
    (ds) =>
      ds.status === "published" &&
      ds.regulationCode === certificate.regulationCode &&
      isEffectiveOnDate(ds.effectiveFrom, ds.effectiveTo, assessmentDate),
  );

  if (matchingDatasets.length !== 1) {
    const reason =
      matchingDatasets.length === 0
        ? `No published regulatory dataset found for '${certificate.regulationCode}' on ${assessmentDate}.`
        : `Multiple published datasets matched for '${certificate.regulationCode}' on ${assessmentDate}; manual review required.`;
    const results: AssessmentItemResult[] = [
      {
        key: "dataset_resolution",
        state: "review",
        testCode: "unclassified",
        testName: "Regulatory dataset selection",
        reason,
        historical: null,
        current: null,
        parameterDiffs: [],
        provenance: null,
      },
    ];
    return {
      assessmentDate,
      overallStatus: "review",
      selectedDatasetId: null,
      selectedDatasetCode: null,
      selectedDatasetVersion: null,
      summaryCounts: summarizeCounts(results),
      results,
    };
  }

  const dataset = matchingDatasets[0];
  const applicableRequirements = dataset.requirements.filter(
    (req) =>
      req.productCategoryId === certificate.productCategoryId &&
      isEffectiveOnDate(req.effectiveFrom, req.effectiveTo, assessmentDate),
  );

  if (applicableRequirements.length === 0) {
    const results: AssessmentItemResult[] = [
      {
        key: "no_category_requirements",
        state: "review",
        testCode: "unclassified",
        testName: "Category requirement lookup",
        reason: `Published dataset '${dataset.code}' has no effective requirements for category '${certificate.productCategoryCode}' on ${assessmentDate}.`,
        historical: null,
        current: null,
        parameterDiffs: [],
        provenance: null,
      },
    ];
    return {
      assessmentDate,
      overallStatus: "review",
      selectedDatasetId: dataset.id,
      selectedDatasetCode: dataset.code,
      selectedDatasetVersion: dataset.datasetVersion,
      summaryCounts: summarizeCounts(results),
      results,
    };
  }

  const historicalByTestCode = new Map<string, HistoricalTestInput[]>();
  for (const hist of certificate.historicalTests) {
    const list = historicalByTestCode.get(hist.testCode) ?? [];
    list.push(hist);
    historicalByTestCode.set(hist.testCode, list);
  }

  const matchedHistoricalCodes = new Set<string>();
  const results: AssessmentItemResult[] = [];

  const sortedRequirements = [...applicableRequirements].sort((a, b) =>
    a.testCode.localeCompare(b.testCode),
  );

  for (const req of sortedRequirements) {
    const evidenceCheck = hasCompleteApprovedEvidence(req, assessmentDate);
    const histMatches = historicalByTestCode.get(req.testCode) ?? [];
    matchedHistoricalCodes.add(req.testCode);

    const provenance: ProvenanceChain = {
      productCategoryCode: req.productCategoryCode,
      productCategoryName: req.productCategoryName,
      regulationCode: req.regulationCode,
      regulationVersionLabel: req.regulationVersionLabel,
      provision: req.provision,
      standardCode: req.standardCode,
      standardVersionLabel: req.standardVersionLabel,
      standardClause: req.standardClause,
      testCode: req.testCode,
      testName: req.testName,
      sourceReference: req.sourceReference,
      sourcePageSection: req.sourcePageSection,
      extractionMethod: req.extractionMethod,
      reviewStatus: req.reviewStatus,
    };

    const currentSummary = {
      requirementId: req.id,
      standardCode: req.standardCode,
      standardVersionLabel: req.standardVersionLabel,
      standardClause: req.standardClause,
      parameters: normalizeTestParameters(req.parameters),
    };

    if (!evidenceCheck.valid) {
      results.push({
        key: `req:${req.id}`,
        state: "review",
        testCode: req.testCode,
        testName: req.testName,
        reason: evidenceCheck.reason ?? "Insufficient evidence for deterministic result.",
        historical: histMatches[0]
          ? {
              standardCode: histMatches[0].standardCode,
              standardVersionLabel: histMatches[0].standardVersionLabel,
              standardClause: histMatches[0].standardClause,
              parameters: normalizeTestParameters(histMatches[0].parameters),
              protocolNumber: histMatches[0].protocolNumber,
              sourcePageSection: histMatches[0].sourcePageSection,
            }
          : null,
        current: currentSummary,
        parameterDiffs: [],
        provenance,
      });
      continue;
    }

    if (histMatches.length > 1) {
      results.push({
        key: `req:${req.id}`,
        state: "review",
        testCode: req.testCode,
        testName: req.testName,
        reason: `Multiple conflicting historical test entries found for '${req.testCode}'; manual review required.`,
        historical: {
          standardCode: histMatches[0].standardCode,
          standardVersionLabel: histMatches[0].standardVersionLabel,
          standardClause: histMatches[0].standardClause,
          parameters: normalizeTestParameters(histMatches[0].parameters),
          protocolNumber: histMatches[0].protocolNumber,
          sourcePageSection: histMatches[0].sourcePageSection,
        },
        current: currentSummary,
        parameterDiffs: [],
        provenance,
      });
      continue;
    }

    if (histMatches.length === 0) {
      results.push({
        key: `req:${req.id}`,
        state: "additional",
        testCode: req.testCode,
        testName: req.testName,
        reason:
          "Required by the current published dataset, but absent from the historical test programme.",
        historical: null,
        current: currentSummary,
        parameterDiffs: [],
        provenance,
      });
      continue;
    }

    const hist = histMatches[0];
    const histNormParams = normalizeTestParameters(hist.parameters);
    const currNormParams = normalizeTestParameters(req.parameters);
    const paramDiffs = diffParameters(histNormParams, currNormParams);

    const standardChanged =
      hist.standardCode !== req.standardCode ||
      hist.standardVersionLabel !== req.standardVersionLabel;
    const clauseChanged =
      (hist.standardClause ?? "").trim() !== req.standardClause.trim();

    if (standardChanged || clauseChanged || paramDiffs.length > 0) {
      const changeReasons: string[] = [];
      if (standardChanged) {
        changeReasons.push(
          `standard changed from ${hist.standardCode ?? "unspecified"} (${hist.standardVersionLabel ?? "unspecified"}) to ${req.standardCode} (${req.standardVersionLabel})`,
        );
      }
      if (clauseChanged) {
        changeReasons.push(
          `clause changed from '${hist.standardClause ?? "unspecified"}' to '${req.standardClause}'`,
        );
      }
      if (paramDiffs.length > 0) {
        changeReasons.push(`parameters changed (${paramDiffs.join("; ")})`);
      }

      results.push({
        key: `req:${req.id}`,
        state: "changed",
        testCode: req.testCode,
        testName: req.testName,
        reason: `Historical and current requirement differ: ${changeReasons.join(", ")}.`,
        historical: {
          standardCode: hist.standardCode,
          standardVersionLabel: hist.standardVersionLabel,
          standardClause: hist.standardClause,
          parameters: histNormParams,
          protocolNumber: hist.protocolNumber,
          sourcePageSection: hist.sourcePageSection,
        },
        current: currentSummary,
        parameterDiffs: paramDiffs,
        provenance,
      });
      continue;
    }

    results.push({
      key: `req:${req.id}`,
      state: "required",
      testCode: req.testCode,
      testName: req.testName,
      reason:
        "Supported by current published requirements and matched by historical test programme.",
      historical: {
        standardCode: hist.standardCode,
        standardVersionLabel: hist.standardVersionLabel,
        standardClause: hist.standardClause,
        parameters: histNormParams,
        protocolNumber: hist.protocolNumber,
        sourcePageSection: hist.sourcePageSection,
      },
      current: currentSummary,
      parameterDiffs: [],
      provenance,
    });
  }

  const unmatchedHistorical = certificate.historicalTests
    .filter((hist) => !matchedHistoricalCodes.has(hist.testCode))
    .sort((a, b) => a.testCode.localeCompare(b.testCode));

  for (const hist of unmatchedHistorical) {
    results.push({
      key: `hist:${hist.id}`,
      state: "historical_only",
      testCode: hist.testCode,
      testName: hist.testName,
      reason:
        "Present in historical test programme without a mapping in the current published dataset.",
      historical: {
        standardCode: hist.standardCode,
        standardVersionLabel: hist.standardVersionLabel,
        standardClause: hist.standardClause,
        parameters: normalizeTestParameters(hist.parameters),
        protocolNumber: hist.protocolNumber,
        sourcePageSection: hist.sourcePageSection,
      },
      current: null,
      parameterDiffs: [],
      provenance: null,
    });
  }

  const summaryCounts = summarizeCounts(results);
  const overallStatus: AssessmentOverallStatus =
    summaryCounts.review > 0 ? "review" : "ready";

  return {
    assessmentDate,
    overallStatus,
    selectedDatasetId: dataset.id,
    selectedDatasetCode: dataset.code,
    selectedDatasetVersion: dataset.datasetVersion,
    summaryCounts,
    results,
  };
}
