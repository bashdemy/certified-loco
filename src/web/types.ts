import type {
  AssessmentItemResult,
  AssessmentSummaryCounts,
} from "../domain/assessment-engine";
import type { Locale } from "../i18n/config";

export type HealthState = "checking" | "ok" | "error";
export type LoadState = "loading" | "ready" | "error";
export type AuditState = "loading" | "ready" | "error" | "hidden";
export type AuthState = "checking" | "authenticated" | "unauthenticated";
export type ActiveTab = "check" | "certificates" | "norms";

export type CurrentUser = {
  email: string;
  role: "admin" | "user";
  displayName?: string;
  slot?: string;
};

export type ManagedAccount = {
  id: string;
  slot: "owner" | "dad";
  email: string;
  displayName: string;
  role: "admin" | "user";
  isActive: boolean;
  updatedAt: string;
};

export type ProductCategory = {
  id: string;
  code: string;
  version: number;
  translations: Array<{
    locale: Locale;
    name: string;
    description: string | null;
  }>;
};

export type CategoryDraft = {
  id: string;
  version: number;
  translations: ProductCategory["translations"];
};

export type NewCategoryDraft = {
  code: string;
  enName: string;
  ruName: string;
  kkName: string;
  description: string;
};

export type AuditEvent = {
  id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  requestId: string;
  reason: string | null;
  createdAt: string;
};

export type CertificateRevisionTest = {
  id: string;
  testId: string;
  testCode: string;
  testName: string;
  standardCode: string | null;
  standardVersionLabel: string | null;
  standardClause: string | null;
  parameters: Record<string, unknown>;
  protocolNumber: string | null;
  sourcePageSection: string | null;
};

export type Certificate = {
  id: string;
  certificateNumber: string;
  status: string;
  version: number;
  revisionId: string;
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
  confirmedAt: string | null;
  confirmedByEmail: string | null;
  createdByEmail: string;
  createdAt: string;
  tests: CertificateRevisionTest[];
};

export type CertificateDraft = {
  certificateNumber: string;
  productCategoryId: string;
  productName: string;
  productModel: string;
  manufacturer: string;
  applicant: string;
  regulationCode: string;
  certificationScheme: string;
  issuedAt: string;
  expiresAt: string;
  confirmed: boolean;
};

export type TestCatalogueItem = {
  id: string;
  code: string;
  name: string;
  method: string | null;
  unit: string | null;
  defaultParametersJson: Record<string, unknown>;
  version: number;
};

export type StandardRecord = {
  id: string;
  code: string;
  name: string;
  versions: Array<{
    id: string;
    versionLabel: string;
    effectiveFrom: string;
    effectiveTo: string | null;
  }>;
};

export type RegulationRecord = {
  id: string;
  code: string;
  name: string;
  versions: Array<{
    id: string;
    versionLabel: string;
    effectiveFrom: string;
    effectiveTo: string | null;
  }>;
};

export type DatasetRequirement = {
  id: string;
  productCategoryCode: string;
  regulationCode: string;
  regulationVersionLabel: string;
  provision: string;
  standardCode: string;
  standardVersionLabel: string;
  standardClause: string;
  testCode: string;
  testName: string;
  parameters: Record<string, unknown>;
  effectiveFrom: string;
  effectiveTo: string | null;
  sourceReference: string;
  sourcePageSection: string;
  extractionMethod: string;
  reviewStatus: string;
};

export type RegulatoryDataset = {
  id: string;
  code: string;
  regulationId: string;
  regulationCode: string;
  title: string;
  datasetVersion: number;
  status: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  version: number;
  publishedAt: string | null;
  publishedByEmail: string | null;
  requirements: DatasetRequirement[];
};

export type AssessmentRecord = {
  id: string;
  certificateRevisionId: string;
  certificateNumber: string;
  revisionNumber: number;
  productName: string;
  productCategoryCode: string;
  productCategoryVersion: number;
  regulatoryDatasetId: string | null;
  regulatoryDatasetCode: string | null;
  assessmentDate: string;
  overallStatus: "ready" | "review";
  summaryCounts: AssessmentSummaryCounts;
  results: AssessmentItemResult[];
  createdByEmail: string;
  createdAt: string;
};
