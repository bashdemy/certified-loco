import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  AssessmentItemResult,
  AssessmentResultState,
  AssessmentSummaryCounts,
} from "../domain/assessment-engine";
import { getLocalizedName } from "../domain/product-category-translations";
import i18n, { type Locale } from "../i18n/config";

type HealthState = "checking" | "ok" | "error";
type LoadState = "loading" | "ready" | "error";
type AuditState = "loading" | "ready" | "error" | "hidden";
type AuthState = "checking" | "authenticated" | "unauthenticated";

type CurrentUser = {
  email: string;
  role: "admin" | "user";
  displayName?: string;
  slot?: string;
};

type ManagedAccount = {
  id: string;
  slot: "owner" | "dad";
  email: string;
  displayName: string;
  role: "admin" | "user";
  isActive: boolean;
  updatedAt: string;
};

type ProductCategory = {
  id: string;
  code: string;
  version: number;
  translations: Array<{
    locale: Locale;
    name: string;
    description: string | null;
  }>;
};

type CategoryDraft = {
  id: string;
  version: number;
  translations: ProductCategory["translations"];
};

type NewCategoryDraft = {
  code: string;
  enName: string;
  ruName: string;
  kkName: string;
  description: string;
};

type AuditEvent = {
  id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  requestId: string;
  reason: string | null;
  createdAt: string;
};

type CertificateRevisionTest = {
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

type Certificate = {
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

type CertificateDraft = {
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

type TestCatalogueItem = {
  id: string;
  code: string;
  name: string;
  method: string | null;
  unit: string | null;
  defaultParametersJson: Record<string, unknown>;
  version: number;
};

type StandardRecord = {
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

type RegulationRecord = {
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

type DatasetRequirement = {
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

type RegulatoryDataset = {
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

type AssessmentRecord = {
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

const healthStyles: Record<HealthState, string> = {
  checking: "bg-amber-100 text-amber-900",
  ok: "bg-emerald-100 text-emerald-900",
  error: "bg-rose-100 text-rose-900",
};

const resultStateStyles: Record<AssessmentResultState, string> = {
  required: "bg-emerald-100 text-emerald-900",
  additional: "bg-blue-100 text-blue-900",
  changed: "bg-amber-100 text-amber-900",
  historical_only: "bg-slate-200 text-slate-800",
  review: "bg-rose-100 text-rose-900",
};

const localeLabels: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  kk: "Қазақша",
};

function getCategoryName(category: ProductCategory, locale: Locale) {
  return getLocalizedName(category.translations, locale) ?? category.code;
}

function App() {
  const { t } = useTranslation();
  const [health, setHealth] = useState<HealthState>("checking");
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [showAccountsPanel, setShowAccountsPanel] = useState(false);
  const [managedAccounts, setManagedAccounts] = useState<ManagedAccount[]>([]);
  const [accountDrafts, setAccountDrafts] = useState<
    Record<
      string,
      { email: string; displayName: string; role: "admin" | "user"; password: string }
    >
  >({});
  const [savingAccountSlot, setSavingAccountSlot] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);

  const [catalogueState, setCatalogueState] = useState<LoadState>("loading");
  const [auditState, setAuditState] = useState<AuditState>("loading");
  const [certificateState, setCertificateState] = useState<LoadState>("loading");
  const [datasetState, setDatasetState] = useState<LoadState>("loading");
  const [assessmentState, setAssessmentState] = useState<LoadState>("loading");

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [datasets, setDatasets] = useState<RegulatoryDataset[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [testsCatalogue, setTestsCatalogue] = useState<TestCatalogueItem[]>([]);
  const [standards, setStandards] = useState<StandardRecord[]>([]);
  const [regulations, setRegulations] = useState<RegulationRecord[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  const [locale, setLocale] = useState<Locale>((i18n.language as Locale) || "en");
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [newCategoryDraft, setNewCategoryDraft] = useState<NewCategoryDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [certificateDraft, setCertificateDraft] = useState<CertificateDraft | null>(null);
  const [creatingCertificate, setCreatingCertificate] = useState(false);
  const [certificateMessage, setCertificateMessage] = useState<string | null>(null);
  const [uploadingRevisionId, setUploadingRevisionId] = useState<string | null>(null);

  const [addingTestForRevisionId, setAddingTestForRevisionId] = useState<string | null>(
    null,
  );
  const [revisionTestForm, setRevisionTestForm] = useState({
    testId: "",
    standardVersionId: "",
    standardClause: "",
    parametersText: "{}",
    protocolNumber: "",
    sourcePageSection: "",
  });

  const [publishReasonByDataset, setPublishReasonByDataset] = useState<
    Record<string, string>
  >({});
  const [datasetMessage, setDatasetMessage] = useState<string | null>(null);
  const [publishingDatasetId, setPublishingDatasetId] = useState<string | null>(null);

  const [selectedRevisionId, setSelectedRevisionId] = useState<string>("");
  const [assessmentDate, setAssessmentDate] = useState<string>("2026-10-31");
  const [runningAssessment, setRunningAssessment] = useState(false);
  const [assessmentMessage, setAssessmentMessage] = useState<string | null>(null);
  const [expandedEvidenceKeys, setExpandedEvidenceKeys] = useState<
    Record<string, boolean>
  >({});

  const [newTestDraft, setNewTestDraft] = useState<{
    code: string;
    name: string;
    method: string;
    unit: string;
  } | null>(null);

  const isAdmin = currentUser?.role !== "user";

  const loadManagedAccounts = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) return;
      const result = (await response.json()) as { data: ManagedAccount[] };
      setManagedAccounts(result.data);
      const drafts: Record<
        string,
        { email: string; displayName: string; role: "admin" | "user"; password: string }
      > = {};
      for (const acc of result.data) {
        drafts[acc.slot] = {
          email: acc.email,
          displayName: acc.displayName,
          role: acc.role,
          password: "",
        };
      }
      setAccountDrafts(drafts);
    } catch {
      // ignore
    }
  };

  const loadAll = async () => {
    fetch("/api/health")
      .then((response) => {
        if (!response.ok) throw new Error("Health check failed");
        setHealth("ok");
      })
      .catch(() => setHealth("error"));

    try {
      const meResponse = await fetch("/api/me");
      if (meResponse.status === 401) {
        setCurrentUser(null);
        setAuthState("unauthenticated");
        return;
      }
      if (!meResponse.ok) {
        setAuthState("unauthenticated");
        return;
      }
      const meResult = (await meResponse.json()) as { data: CurrentUser };
      setCurrentUser(meResult.data);
      setAuthState("authenticated");
      if (meResult.data.role === "admin") {
        void loadManagedAccounts();
      }
    } catch {
      setAuthState("unauthenticated");
      return;
    }

    fetch("/api/product-categories")
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalogue request failed");
        const result = (await response.json()) as { data: ProductCategory[] };
        setCategories(result.data);
        setCatalogueState("ready");
      })
      .catch(() => setCatalogueState("error"));

    fetch("/api/certificates")
      .then(async (response) => {
        if (!response.ok) throw new Error("Certificates request failed");
        const result = (await response.json()) as { data: Certificate[] };
        setCertificates(result.data);
        setCertificateState("ready");
        if (result.data[0] && !selectedRevisionId) {
          setSelectedRevisionId(result.data[0].revisionId);
        }
      })
      .catch(() => setCertificateState("error"));

    fetch("/api/regulatory-datasets")
      .then(async (response) => {
        if (!response.ok) throw new Error("Datasets request failed");
        const result = (await response.json()) as { data: RegulatoryDataset[] };
        setDatasets(result.data);
        setDatasetState("ready");
      })
      .catch(() => setDatasetState("error"));

    fetch("/api/assessments")
      .then(async (response) => {
        if (!response.ok) throw new Error("Assessments request failed");
        const result = (await response.json()) as { data: AssessmentRecord[] };
        setAssessments(result.data);
        setAssessmentState("ready");
      })
      .catch(() => setAssessmentState("error"));

    fetch("/api/tests")
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as { data: TestCatalogueItem[] };
        setTestsCatalogue(result.data);
      })
      .catch(() => undefined);

    fetch("/api/standards")
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as { data: StandardRecord[] };
        setStandards(result.data);
      })
      .catch(() => undefined);

    fetch("/api/regulations")
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as { data: RegulationRecord[] };
        setRegulations(result.data);
      })
      .catch(() => undefined);

    fetch("/api/audit-events")
      .then(async (response) => {
        if (response.status === 403) {
          setAuditState("hidden");
          return;
        }
        if (!response.ok) throw new Error("Audit request failed");
        const result = (await response.json()) as { data: AuditEvent[] };
        setAuditEvents(result.data);
        setAuditState("ready");
      })
      .catch(() => setAuditState("error"));
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setSigningIn(true);
    setLoginError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      if (!response.ok) {
        setLoginError(t("invalidCredentials"));
        return;
      }
      setLoginPassword("");
      await loadAll();
    } catch {
      setLoginError(t("invalidCredentials"));
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setAuthState("unauthenticated");
  };

  const saveManagedAccount = async (slot: "owner" | "dad") => {
    const draftAcc = accountDrafts[slot];
    if (!draftAcc) return;
    setSavingAccountSlot(slot);
    setAccountMessage(null);
    try {
      const response = await fetch(`/api/users/${slot}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: draftAcc.email,
          displayName: draftAcc.displayName,
          role: draftAcc.role,
          password: draftAcc.password || undefined,
        }),
      });
      if (!response.ok) {
        setAccountMessage(t("saveFailed"));
        return;
      }
      await loadManagedAccounts();
      setAccountMessage(t("accountUpdated"));
    } catch {
      setAccountMessage(t("saveFailed"));
    } finally {
      setSavingAccountSlot(null);
    }
  };

  const refreshAuditAndDatasets = async () => {
    const [dsRes, auditRes] = await Promise.all([
      fetch("/api/regulatory-datasets"),
      fetch("/api/audit-events"),
    ]);
    if (dsRes.ok) {
      const dsJson = (await dsRes.json()) as { data: RegulatoryDataset[] };
      setDatasets(dsJson.data);
    }
    if (auditRes.ok) {
      const auditJson = (await auditRes.json()) as { data: AuditEvent[] };
      setAuditEvents(auditJson.data);
    }
  };

  const changeLocale = (nextLocale: Locale) => {
    void i18n.changeLanguage(nextLocale);
    setLocale(nextLocale);
  };

  const startEditing = (category: ProductCategory) => {
    setSaveMessage(null);
    setDraft({
      id: category.id,
      version: category.version,
      translations: category.translations.map((translation) => ({ ...translation })),
    });
  };

  const cancelEditing = () => setDraft(null);

  const updateDraft = (
    localeToUpdate: Locale,
    field: "name" | "description",
    value: string,
  ) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            translations: current.translations.map((translation) =>
              translation.locale === localeToUpdate
                ? { ...translation, [field]: value }
                : translation,
            ),
          }
        : current,
    );
  };

  const saveCategory = async () => {
    if (!draft) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(`/api/product-categories/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json()) as { data?: ProductCategory };

      if (response.status === 409 && result.data) {
        setCategories((current) =>
          current.map((category) =>
            category.id === result.data?.id ? result.data : category,
          ),
        );
        setDraft(null);
        setSaveMessage(t("versionConflict"));
        return;
      }

      if (!response.ok || !result.data) throw new Error("Save failed");

      setCategories((current) =>
        current.map((category) =>
          category.id === result.data?.id ? result.data : category,
        ),
      );
      setDraft(null);
      void refreshAuditAndDatasets();
    } catch {
      setSaveMessage(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const createNewCategory = async () => {
    if (!newCategoryDraft || !newCategoryDraft.code || !newCategoryDraft.enName) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const translations = [
        {
          locale: "en",
          name: newCategoryDraft.enName,
          description: newCategoryDraft.description || null,
        },
        ...(newCategoryDraft.ruName
          ? [{ locale: "ru", name: newCategoryDraft.ruName, description: null }]
          : []),
        ...(newCategoryDraft.kkName
          ? [{ locale: "kk", name: newCategoryDraft.kkName, description: null }]
          : []),
      ];
      const response = await fetch("/api/product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCategoryDraft.code,
          translations,
        }),
      });
      if (!response.ok) throw new Error("Create category failed");
      const catRes = await fetch("/api/product-categories");
      if (catRes.ok) {
        const catJson = (await catRes.json()) as { data: ProductCategory[] };
        setCategories(catJson.data);
      }
      setNewCategoryDraft(null);
      void refreshAuditAndDatasets();
    } catch {
      setSaveMessage(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const startCertificate = () => {
    setCertificateMessage(null);
    setCertificateDraft({
      certificateNumber: "",
      productCategoryId: categories[0]?.id ?? "",
      productName: "",
      productModel: "",
      manufacturer: "",
      applicant: "",
      regulationCode: "ТР ТС 001/2011",
      certificationScheme: "3c",
      issuedAt: "",
      expiresAt: "",
      confirmed: true,
    });
  };

  const updateCertificateDraft = (
    field: keyof CertificateDraft,
    value: string | boolean,
  ) => {
    setCertificateDraft((current) =>
      current ? { ...current, [field]: value } : current,
    );
  };

  const loadCertificates = async () => {
    const response = await fetch("/api/certificates");
    if (!response.ok) throw new Error("Certificates request failed");
    const result = (await response.json()) as { data: Certificate[] };
    setCertificates(result.data);
    setCertificateState("ready");
    if (result.data[0] && !selectedRevisionId) {
      setSelectedRevisionId(result.data[0].revisionId);
    }
  };

  const createCertificateRecord = async () => {
    if (!certificateDraft) return;

    setCreatingCertificate(true);
    setCertificateMessage(null);

    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(certificateDraft),
      });

      if (!response.ok) throw new Error("Certificate creation failed");

      await loadCertificates();
      void refreshAuditAndDatasets();
      setCertificateDraft(null);
      setCertificateMessage(t("certificateCreated"));
    } catch {
      setCertificateMessage(t("certificateFailed"));
    } finally {
      setCreatingCertificate(false);
    }
  };

  const confirmRevision = async (revisionId: string) => {
    try {
      const response = await fetch(`/api/certificate-revisions/${revisionId}/confirm`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Confirmation failed");
      await loadCertificates();
      void refreshAuditAndDatasets();
    } catch {
      setCertificateMessage(t("saveFailed"));
    }
  };

  const submitRevisionTest = async (revisionId: string) => {
    if (!revisionTestForm.testId) return;
    try {
      let parsedParams: Record<string, unknown> = {};
      if (revisionTestForm.parametersText.trim()) {
        parsedParams = JSON.parse(revisionTestForm.parametersText) as Record<
          string,
          unknown
        >;
      }
      const response = await fetch(`/api/certificate-revisions/${revisionId}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: revisionTestForm.testId,
          standardVersionId: revisionTestForm.standardVersionId || null,
          standardClause: revisionTestForm.standardClause || null,
          parameters: parsedParams,
          protocolNumber: revisionTestForm.protocolNumber || null,
          sourcePageSection: revisionTestForm.sourcePageSection || null,
        }),
      });
      if (!response.ok) throw new Error("Add test failed");
      setAddingTestForRevisionId(null);
      await loadCertificates();
      void refreshAuditAndDatasets();
    } catch {
      setCertificateMessage(t("saveFailed"));
    }
  };

  const uploadCertificateDocument = async (certificate: Certificate, file: File) => {
    if (file.type !== "application/pdf") {
      setCertificateMessage(t("documentUploadFailed"));
      return;
    }

    setUploadingRevisionId(certificate.revisionId);
    setCertificateMessage(null);

    try {
      const response = await fetch(
        `/api/certificate-revisions/${certificate.revisionId}/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": file.type,
            "X-File-Name": file.name,
          },
          body: file,
        },
      );

      if (!response.ok) throw new Error("Document upload failed");
      setCertificateMessage(t("documentUploaded"));
      void refreshAuditAndDatasets();
    } catch {
      setCertificateMessage(t("documentUploadFailed"));
    } finally {
      setUploadingRevisionId(null);
    }
  };

  const handleReviewRequirement = async (
    requirementId: string,
    reviewStatus: "approved" | "rejected",
  ) => {
    setDatasetMessage(null);
    try {
      const response = await fetch(`/api/requirements/${requirementId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewStatus,
          reason: `Reviewed and marked ${reviewStatus} via regulatory workspace`,
        }),
      });
      if (!response.ok) throw new Error("Review failed");
      await refreshAuditAndDatasets();
    } catch {
      setDatasetMessage(t("saveFailed"));
    }
  };

  const handlePublishDataset = async (datasetId: string) => {
    const reason = (publishReasonByDataset[datasetId] ?? "").trim();
    if (!reason) {
      setDatasetMessage("A review reason is required to publish a dataset.");
      return;
    }
    setPublishingDatasetId(datasetId);
    setDatasetMessage(null);
    try {
      const response = await fetch(`/api/regulatory-datasets/${datasetId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const result = (await response.json()) as {
        error?: string;
        errors?: string[];
      };
      if (!response.ok) {
        setDatasetMessage(
          result.errors?.join(" ") ?? result.error ?? "Could not publish dataset.",
        );
        return;
      }
      await refreshAuditAndDatasets();
      setDatasetMessage("Regulatory dataset published.");
    } catch {
      setDatasetMessage("Could not publish dataset.");
    } finally {
      setPublishingDatasetId(null);
    }
  };

  const handleRunAssessment = async () => {
    if (!selectedRevisionId || !assessmentDate) return;
    setRunningAssessment(true);
    setAssessmentMessage(null);
    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateRevisionId: selectedRevisionId,
          assessmentDate,
        }),
      });
      if (!response.ok) throw new Error("Assessment run failed");
      const listRes = await fetch("/api/assessments");
      if (listRes.ok) {
        const listJson = (await listRes.json()) as { data: AssessmentRecord[] };
        setAssessments(listJson.data);
      }
      void refreshAuditAndDatasets();
    } catch {
      setAssessmentMessage("Could not run assessment.");
    } finally {
      setRunningAssessment(false);
    }
  };

  const createTestCatalogueRecord = async () => {
    if (!newTestDraft || !newTestDraft.code || !newTestDraft.name) return;
    try {
      const response = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTestDraft),
      });
      if (!response.ok) throw new Error("Failed to create test");
      const testsRes = await fetch("/api/tests");
      if (testsRes.ok) {
        const testsJson = (await testsRes.json()) as { data: TestCatalogueItem[] };
        setTestsCatalogue(testsJson.data);
      }
      setNewTestDraft(null);
      void refreshAuditAndDatasets();
    } catch {
      setSaveMessage(t("saveFailed"));
    }
  };

  const toggleEvidence = (key: string) => {
    setExpandedEvidenceKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const standardVersionOptions = standards.flatMap((std) =>
    std.versions.map((ver) => ({
      id: ver.id,
      label: `${std.code} (${ver.versionLabel})`,
    })),
  );

  if (authState === "unauthenticated") {
    return (
      <main className="mx-auto flex min-h-screen w-[calc(100%-2rem)] max-w-md flex-col justify-center py-12 text-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold tracking-[0.11em] text-slate-500 uppercase">
              {t("appEyebrow")}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("appName")}
            </h1>
          </div>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            value={locale}
            onChange={(event) => changeLocale(event.target.value as Locale)}
          >
            {(Object.keys(localeLabels) as Locale[]).map((language) => (
              <option key={language} value={language}>
                {localeLabels[language]}
              </option>
            ))}
          </select>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-1 text-xl font-bold text-slate-900">{t("signInTitle")}</h2>
          <p className="mb-6 text-sm text-slate-500">{t("signInSubtitle")}</p>

          {loginError && (
            <p className="mb-4 rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-900">
              {loginError}
            </p>
          )}

          <form onSubmit={(e) => void handleLogin(e)} className="grid gap-4">
            <label className="block text-sm font-semibold text-slate-700">
              {t("emailLabel")}
              <input
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              {t("passwordLabel")}
              <input
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={signingIn}
              className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {signingIn ? t("signingIn") : t("signInButton")}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-6xl bg-slate-50 py-8 pb-16 text-slate-900 sm:py-12">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="mb-2 text-xs font-extrabold tracking-[0.11em] text-slate-500 uppercase">
            {t("appEyebrow")}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("appName")}
          </h1>
          {currentUser && (
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {currentUser.displayName ? `${currentUser.displayName} · ` : ""}
              {currentUser.email} ({currentUser.role})
            </p>
          )}
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-2 text-xs font-extrabold ${healthStyles[health]}`}
            >
              {health === "checking" && t("checkingApi")}
              {health === "ok" && t("apiConnected")}
              {health === "error" && t("apiUnavailable")}
            </span>
            {isAdmin && managedAccounts.length > 0 && (
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
                onClick={() => setShowAccountsPanel((prev) => !prev)}
              >
                {t("manageAccounts")}
              </button>
            )}
            {currentUser && currentUser.email !== "local@development" && (
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                onClick={() => void handleLogout()}
              >
                {t("signOutButton")}
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="sr-only">Language</span>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={locale}
              onChange={(event) => changeLocale(event.target.value as Locale)}
            >
              {(Object.keys(localeLabels) as Locale[]).map((language) => (
                <option key={language} value={language}>
                  {localeLabels[language]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {isAdmin && showAccountsPanel && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t("manageAccounts")}</h2>
              <p className="text-xs text-slate-500">
                Configure your account and your dad&apos;s account (leave password blank
                to keep current).
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
              onClick={() => setShowAccountsPanel(false)}
            >
              {t("cancel")}
            </button>
          </div>
          {accountMessage && (
            <p className="mb-4 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-900">
              {accountMessage}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {(["owner", "dad"] as const).map((slot) => {
              const draftAcc = accountDrafts[slot] ?? {
                email: "",
                displayName: slot === "owner" ? "Maria" : "Dad",
                role: "admin",
                password: "",
              };
              return (
                <div
                  key={slot}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="mb-2 text-xs font-extrabold tracking-wider text-blue-700 uppercase">
                    {slot === "owner" ? "Account 1 · Owner" : "Account 2 · Dad"}
                  </p>
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Name
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-normal"
                        value={draftAcc.displayName}
                        onChange={(e) =>
                          setAccountDrafts((prev) => ({
                            ...prev,
                            [slot]: { ...draftAcc, displayName: e.target.value },
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-700">
                      {t("emailLabel")}
                      <input
                        type="email"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-normal"
                        value={draftAcc.email}
                        onChange={(e) =>
                          setAccountDrafts((prev) => ({
                            ...prev,
                            [slot]: { ...draftAcc, email: e.target.value },
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-700">
                      Role
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-normal"
                        value={draftAcc.role}
                        onChange={(e) =>
                          setAccountDrafts((prev) => ({
                            ...prev,
                            [slot]: {
                              ...draftAcc,
                              role: e.target.value as "admin" | "user",
                            },
                          }))
                        }
                      >
                        <option value="admin">admin</option>
                        <option value="user">user (read-only)</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-700">
                      New password (min 8 chars, optional)
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-normal"
                        value={draftAcc.password}
                        onChange={(e) =>
                          setAccountDrafts((prev) => ({
                            ...prev,
                            [slot]: { ...draftAcc, password: e.target.value },
                          }))
                        }
                      />
                    </label>
                    <button
                      type="button"
                      disabled={savingAccountSlot === slot}
                      className="mt-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      onClick={() => void saveManagedAccount(slot)}
                    >
                      {savingAccountSlot === slot ? t("saving") : t("save")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-4 rounded-[22px] bg-slate-900 p-6 text-slate-100 shadow-xl sm:p-12">
        <p className="mb-2 text-xs font-extrabold tracking-[0.11em] text-slate-400 uppercase">
          {t("firstRelease")}
        </p>
        <h2 className="mb-4 max-w-3xl text-4xl leading-tight font-bold tracking-[-0.04em] text-white sm:text-6xl">
          {t("headline")}
        </h2>
        <p className="mb-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
          {t("intro")}
        </p>
        <a
          href="#assessments-section"
          className="inline-block rounded-[10px] bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-500"
        >
          {t("newAssessment")}
        </a>
      </section>

      <section className="mb-4 grid gap-4 sm:grid-cols-3" aria-label={t("appName")}>
        <article className="min-h-44 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="mb-8 block text-xs font-extrabold text-blue-600">01</span>
          <h3 className="mb-2 text-lg font-bold text-slate-900">{t("assessments")}</h3>
          <p className="leading-relaxed text-slate-500">{t("assessmentsDescription")}</p>
        </article>
        <article className="min-h-44 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="mb-8 block text-xs font-extrabold text-blue-600">02</span>
          <h3 className="mb-2 text-lg font-bold text-slate-900">
            {t("knowledgeCatalogue")}
          </h3>
          <p className="leading-relaxed text-slate-500">
            {t("knowledgeCatalogueDescription")}
          </p>
        </article>
        <article className="min-h-44 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="mb-8 block text-xs font-extrabold text-blue-600">03</span>
          <h3 className="mb-2 text-lg font-bold text-slate-900">
            {t("reviewAndPublish")}
          </h3>
          <p className="leading-relaxed text-slate-500">
            {t("reviewAndPublishDescription")}
          </p>
        </article>
      </section>

      {/* Assessments Section */}
      <section
        id="assessments-section"
        className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-xs font-extrabold tracking-[0.11em] text-slate-500 uppercase">
              01 / {t("assessments")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("assessments")}
            </h2>
          </div>
        </div>

        <div className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
            {t("selectCertificateRevision")}
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900"
              value={selectedRevisionId}
              onChange={(event) => setSelectedRevisionId(event.target.value)}
            >
              <option value="">--</option>
              {certificates.map((cert) => (
                <option key={cert.revisionId} value={cert.revisionId}>
                  {cert.certificateNumber} (v{cert.revisionNumber}) — {cert.productName} [
                  {cert.confirmedAt ? t("confirmed") : t("unconfirmed")}]
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            {t("assessmentDate")}
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900"
              value={assessmentDate}
              onChange={(event) => setAssessmentDate(event.target.value)}
            />
          </label>
          <div className="sm:col-span-3">
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              disabled={runningAssessment || !selectedRevisionId || !assessmentDate}
              onClick={() => void handleRunAssessment()}
            >
              {runningAssessment ? t("runningAssessment") : t("runAssessmentButton")}
            </button>
          </div>
        </div>

        {assessmentMessage && (
          <p className="mb-4 text-sm text-amber-700">{assessmentMessage}</p>
        )}

        {assessmentState === "ready" && assessments.length === 0 && (
          <p className="text-slate-500">{t("noAssessments")}</p>
        )}

        {assessmentState === "ready" && assessments.length > 0 && (
          <div className="space-y-4">
            {assessments.map((assessment) => (
              <article
                key={assessment.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold tracking-wide text-blue-600 uppercase">
                      {assessment.certificateNumber} (v{assessment.revisionNumber}) •{" "}
                      {assessment.assessmentDate}
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">
                      {assessment.productName} ({assessment.productCategoryCode} v
                      {assessment.productCategoryVersion})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Dataset: {assessment.regulatoryDatasetCode ?? "None matched"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                        assessment.overallStatus === "ready"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-rose-100 text-rose-900"
                      }`}
                    >
                      {assessment.overallStatus}
                    </span>
                    {(
                      Object.entries(assessment.summaryCounts) as Array<
                        [AssessmentResultState, number]
                      >
                    ).map(([state, count]) =>
                      count > 0 ? (
                        <span
                          key={state}
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${resultStateStyles[state]}`}
                        >
                          {state}: {count}
                        </span>
                      ) : null,
                    )}
                  </div>
                </div>

                <div className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                  {assessment.results.map((item) => {
                    const evidenceKey = `${assessment.id}:${item.key}`;
                    const isExpanded = Boolean(expandedEvidenceKeys[evidenceKey]);

                    return (
                      <div key={item.key} className="p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span
                              className={`mr-2 inline-block rounded px-2 py-0.5 text-xs font-bold uppercase ${resultStateStyles[item.state]}`}
                            >
                              {item.state}
                            </span>
                            <strong className="text-slate-900">{item.testName}</strong>{" "}
                            <span className="text-xs text-slate-500">
                              ({item.testCode})
                            </span>
                          </div>
                          {item.provenance && (
                            <button
                              type="button"
                              className="text-xs font-bold text-blue-600 hover:underline"
                              onClick={() => toggleEvidence(evidenceKey)}
                            >
                              {t("viewEvidence")} {isExpanded ? "▲" : "▼"}
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-slate-600">{item.reason}</p>

                        {isExpanded && item.provenance && (
                          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                            <p className="font-bold text-slate-900">
                              {item.provenance.productCategoryName} (
                              {item.provenance.productCategoryCode}) →{" "}
                              {item.provenance.regulationCode} (
                              {item.provenance.regulationVersionLabel}) →{" "}
                              {item.provenance.provision} → {item.provenance.standardCode}{" "}
                              ({item.provenance.standardVersionLabel}) →{" "}
                              {item.provenance.standardClause} →{" "}
                              {item.provenance.testCode}
                            </p>
                            <p className="mt-1">
                              Source: <strong>{item.provenance.sourceReference}</strong> —{" "}
                              {item.provenance.sourcePageSection} (
                              {item.provenance.extractionMethod},{" "}
                              {item.provenance.reviewStatus})
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Regulatory Datasets (Review & Publish) */}
      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-extrabold tracking-[0.11em] text-slate-500 uppercase">
              03 / {t("reviewAndPublish")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("regulatoryDatasets")}
            </h2>
          </div>
        </div>

        {datasetMessage && (
          <p className="mb-4 text-sm text-amber-700">{datasetMessage}</p>
        )}

        {datasetState === "ready" && datasets.length > 0 && (
          <div className="space-y-4">
            {datasets.map((dataset) => {
              const isMutable = dataset.status === "draft" || dataset.status === "review";

              return (
                <article
                  key={dataset.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold tracking-wide text-blue-600 uppercase">
                        {dataset.code} • {dataset.regulationCode} • v
                        {dataset.datasetVersion}
                      </p>
                      <h3 className="text-lg font-bold text-slate-900">
                        {dataset.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Effective: {dataset.effectiveFrom} →{" "}
                        {dataset.effectiveTo ?? "open"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                        dataset.status === "published"
                          ? "bg-emerald-100 text-emerald-900"
                          : dataset.status === "superseded"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {dataset.status === "published"
                        ? t("publishedLockedNotice")
                        : dataset.status === "superseded"
                          ? t("supersededNotice")
                          : dataset.status}
                    </span>
                  </div>

                  <div className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                    {dataset.requirements.map((req) => (
                      <div
                        key={req.id}
                        className="flex flex-col justify-between gap-2 p-3 text-sm sm:flex-row sm:items-center"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            [{req.productCategoryCode}] {req.testName} ({req.testCode})
                          </p>
                          <p className="text-xs text-slate-600">
                            {req.regulationCode} ({req.provision}) → {req.standardCode} (
                            {req.standardVersionLabel}) {req.standardClause}
                          </p>
                          <p className="text-xs text-slate-500">
                            Evidence: {req.sourceReference} — {req.sourcePageSection}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                              req.reviewStatus === "approved"
                                ? "bg-emerald-100 text-emerald-900"
                                : req.reviewStatus === "rejected"
                                  ? "bg-rose-100 text-rose-900"
                                  : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {req.reviewStatus}
                          </span>
                          {isAdmin && isMutable && req.reviewStatus !== "approved" && (
                            <button
                              type="button"
                              className="rounded border border-emerald-600 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800"
                              onClick={() =>
                                void handleReviewRequirement(req.id, "approved")
                              }
                            >
                              {t("approveRequirement")}
                            </button>
                          )}
                          {isAdmin && isMutable && req.reviewStatus !== "rejected" && (
                            <button
                              type="button"
                              className="rounded border border-rose-300 bg-white px-2.5 py-1 text-xs font-bold text-rose-700"
                              onClick={() =>
                                void handleReviewRequirement(req.id, "rejected")
                              }
                            >
                              {t("rejectRequirement")}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {isAdmin && isMutable && (
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        placeholder={t("publishReasonPlaceholder")}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        value={publishReasonByDataset[dataset.id] ?? ""}
                        onChange={(event) =>
                          setPublishReasonByDataset((prev) => ({
                            ...prev,
                            [dataset.id]: event.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                        disabled={publishingDatasetId === dataset.id}
                        onClick={() => void handlePublishDataset(dataset.id)}
                      >
                        {publishingDatasetId === dataset.id
                          ? t("publishing")
                          : t("publishDataset")}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Certificates Section */}
      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-extrabold tracking-[0.11em] text-slate-500 uppercase">
              02 / {t("knowledgeCatalogue")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("certificates")}
            </h2>
          </div>
          {isAdmin && !certificateDraft && (
            <button
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"
              type="button"
              onClick={startCertificate}
            >
              {t("newCertificate")}
            </button>
          )}
        </div>

        {certificateDraft && (
          <div className="mb-5 grid gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-2">
            {(
              [
                ["certificateNumber", "certificateNumber"],
                ["productName", "productName"],
                ["productModel", "productModel"],
                ["manufacturer", "manufacturer"],
                ["applicant", "applicant"],
                ["regulationCode", "regulationCode"],
                ["certificationScheme", "certificationScheme"],
                ["issuedAt", "issuedAt"],
                ["expiresAt", "expiresAt"],
              ] as Array<[keyof CertificateDraft, string]>
            ).map(([field, labelKey]) => (
              <label className="block text-sm font-semibold text-slate-700" key={field}>
                {t(labelKey)}
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900"
                  type={field === "issuedAt" || field === "expiresAt" ? "date" : "text"}
                  value={String(certificateDraft[field])}
                  onChange={(event) => updateCertificateDraft(field, event.target.value)}
                />
              </label>
            ))}
            <label className="block text-sm font-semibold text-slate-700">
              {t("productCategory")}
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900"
                value={certificateDraft.productCategoryId}
                onChange={(event) =>
                  updateCertificateDraft("productCategoryId", event.target.value)
                }
              >
                <option value="">{t("selectCategory")}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getCategoryName(category, "en")}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2 sm:col-span-2">
              <button
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                type="button"
                onClick={() => void createCertificateRecord()}
                disabled={creatingCertificate || !certificateDraft.productCategoryId}
              >
                {creatingCertificate ? t("creating") : t("create")}
              </button>
              <button
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                type="button"
                onClick={() => setCertificateDraft(null)}
                disabled={creatingCertificate}
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}

        {certificateMessage && (
          <p className="mb-4 text-sm text-amber-700">{certificateMessage}</p>
        )}
        {certificateState === "loading" && (
          <p className="text-slate-500">{t("loadingCertificates")}</p>
        )}
        {certificateState === "error" && (
          <p className="text-rose-700">{t("certificatesUnavailable")}</p>
        )}
        {certificateState === "ready" && certificates.length === 0 && (
          <p className="text-slate-500">{t("noCertificates")}</p>
        )}
        {certificateState === "ready" && certificates.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {certificates.map((certificate) => (
              <article
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                key={`${certificate.id}-${certificate.revisionNumber}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-1 text-xs font-extrabold tracking-wide text-blue-600 uppercase">
                      {certificate.certificateNumber}
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">
                      {certificate.productName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        certificate.confirmedAt
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {certificate.confirmedAt ? t("confirmed") : t("unconfirmed")}
                    </span>
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">
                      v{certificate.revisionNumber}
                    </span>
                  </div>
                </div>
                <dl className="mt-3 grid gap-1 text-sm text-slate-600">
                  <div className="flex justify-between gap-3">
                    <dt>{t("productCategory")}</dt>
                    <dd>{certificate.productCategoryCode}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>{t("manufacturer")}</dt>
                    <dd>{certificate.manufacturer}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>{t("regulationCode")}</dt>
                    <dd>{certificate.regulationCode}</dd>
                  </div>
                </dl>

                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="mb-1 text-xs font-bold text-slate-700 uppercase">
                    {t("historicalTests")} ({certificate.tests?.length ?? 0})
                  </p>
                  {(!certificate.tests || certificate.tests.length === 0) && (
                    <p className="text-xs text-slate-500">{t("noHistoricalTests")}</p>
                  )}
                  {certificate.tests && certificate.tests.length > 0 && (
                    <ul className="space-y-1 text-xs text-slate-600">
                      {certificate.tests.map((testItem) => (
                        <li key={testItem.id}>
                          • <strong>{testItem.testName}</strong> —{" "}
                          {testItem.standardCode ?? ""} {testItem.standardClause ?? ""}{" "}
                          <code>{JSON.stringify(testItem.parameters)}</code>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {addingTestForRevisionId === certificate.revisionId && (
                  <div className="mt-3 space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs">
                    <select
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1.5"
                      value={revisionTestForm.testId}
                      onChange={(e) =>
                        setRevisionTestForm((prev) => ({
                          ...prev,
                          testId: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select test…</option>
                      {testsCatalogue.map((tc) => (
                        <option key={tc.id} value={tc.id}>
                          {tc.name} ({tc.code})
                        </option>
                      ))}
                    </select>
                    <select
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1.5"
                      value={revisionTestForm.standardVersionId}
                      onChange={(e) =>
                        setRevisionTestForm((prev) => ({
                          ...prev,
                          standardVersionId: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select standard version…</option>
                      {standardVersionOptions.map((sv) => (
                        <option key={sv.id} value={sv.id}>
                          {sv.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Clause (e.g. Clause 5.2.4)"
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1.5"
                      value={revisionTestForm.standardClause}
                      onChange={(e) =>
                        setRevisionTestForm((prev) => ({
                          ...prev,
                          standardClause: e.target.value,
                        }))
                      }
                    />
                    <input
                      type="text"
                      placeholder='Parameters JSON (e.g. {"sensitivityMm2": 2})'
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1.5"
                      value={revisionTestForm.parametersText}
                      onChange={(e) =>
                        setRevisionTestForm((prev) => ({
                          ...prev,
                          parametersText: e.target.value,
                        }))
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded bg-blue-600 px-2.5 py-1 font-bold text-white"
                        onClick={() => void submitRevisionTest(certificate.revisionId)}
                      >
                        {t("save")}
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-300 bg-white px-2.5 py-1 font-bold text-slate-700"
                        onClick={() => setAddingTestForRevisionId(null)}
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!certificate.confirmedAt && (
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                        onClick={() => void confirmRevision(certificate.revisionId)}
                      >
                        {t("confirmRevision")}
                      </button>
                    )}
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                      onClick={() => {
                        setAddingTestForRevisionId(certificate.revisionId);
                        setRevisionTestForm({
                          testId: testsCatalogue[0]?.id ?? "",
                          standardVersionId: standardVersionOptions[0]?.id ?? "",
                          standardClause: "Clause 5.2.4",
                          parametersText: "{}",
                          protocolNumber: "",
                          sourcePageSection: "",
                        });
                      }}
                    >
                      {t("addHistoricalTest")}
                    </button>
                    <label className="inline-flex cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                      {uploadingRevisionId === certificate.revisionId
                        ? t("uploadingDocument")
                        : t("uploadDocument")}
                      <input
                        className="sr-only"
                        type="file"
                        accept="application/pdf"
                        disabled={uploadingRevisionId !== null}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadCertificateDocument(certificate, file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Product Categories Section */}
      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-extrabold tracking-[0.11em] text-slate-500 uppercase">
              {t("connectedData")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("productCategories")}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {catalogueState === "ready" ? `${categories.length} ${t("records")}` : ""}
            </span>
            {isAdmin && !newCategoryDraft && (
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"
                onClick={() =>
                  setNewCategoryDraft({
                    code: "",
                    enName: "",
                    ruName: "",
                    kkName: "",
                    description: "",
                  })
                }
              >
                {t("newCategory")}
              </button>
            )}
          </div>
        </div>

        {newCategoryDraft && (
          <div className="mb-5 grid gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              {t("categoryCode")}
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900"
                value={newCategoryDraft.code}
                onChange={(e) =>
                  setNewCategoryDraft((prev) =>
                    prev ? { ...prev, code: e.target.value } : prev,
                  )
                }
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              {t("englishName")}
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900"
                value={newCategoryDraft.enName}
                onChange={(e) =>
                  setNewCategoryDraft((prev) =>
                    prev ? { ...prev, enName: e.target.value } : prev,
                  )
                }
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              {t("russianName")}
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900"
                value={newCategoryDraft.ruName}
                onChange={(e) =>
                  setNewCategoryDraft((prev) =>
                    prev ? { ...prev, ruName: e.target.value } : prev,
                  )
                }
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              {t("kazakhName")}
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900"
                value={newCategoryDraft.kkName}
                onChange={(e) =>
                  setNewCategoryDraft((prev) =>
                    prev ? { ...prev, kkName: e.target.value } : prev,
                  )
                }
              />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"
                onClick={() => void createNewCategory()}
              >
                {t("create")}
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                onClick={() => setNewCategoryDraft(null)}
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}

        {catalogueState === "loading" && (
          <p className="text-slate-500">{t("loadingCatalogue")}</p>
        )}
        {catalogueState === "error" && (
          <p className="text-rose-700">{t("catalogueUnavailable")}</p>
        )}
        {catalogueState === "ready" && categories.length === 0 && (
          <p className="text-slate-500">{t("noCategories")}</p>
        )}
        {catalogueState === "ready" && categories.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((category) => (
              <article
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                key={category.id}
              >
                {draft?.id === category.id ? (
                  <div className="space-y-3">
                    <p className="text-xs font-extrabold tracking-wide text-blue-600 uppercase">
                      {category.code}
                    </p>
                    {(["en", "ru", "kk"] as Locale[]).map((translationLocale) => {
                      const translation = draft.translations.find(
                        (item) => item.locale === translationLocale,
                      );
                      if (!translation) return null;

                      const label =
                        translationLocale === "en"
                          ? t("englishName")
                          : translationLocale === "ru"
                            ? t("russianName")
                            : t("kazakhName");

                      return (
                        <label
                          className="block text-sm font-semibold text-slate-700"
                          key={translationLocale}
                        >
                          {label}
                          <input
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900"
                            value={translation.name}
                            onChange={(event) =>
                              updateDraft(translationLocale, "name", event.target.value)
                            }
                          />
                        </label>
                      );
                    })}
                    <label className="block text-sm font-semibold text-slate-700">
                      {t("description")}
                      <textarea
                        className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900"
                        value={
                          draft.translations.find((item) => item.locale === "en")
                            ?.description ?? ""
                        }
                        onChange={(event) =>
                          updateDraft("en", "description", event.target.value)
                        }
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                        type="button"
                        onClick={() => void saveCategory()}
                        disabled={saving}
                      >
                        {saving ? t("saving") : t("save")}
                      </button>
                      <button
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                        type="button"
                        onClick={cancelEditing}
                        disabled={saving}
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="mb-1 text-xs font-extrabold tracking-wide text-blue-600 uppercase">
                          {category.code}
                        </p>
                        <h3 className="mb-1 text-lg font-bold text-slate-900">
                          {getCategoryName(category, locale)}
                        </h3>
                        {locale !== "en" && (
                          <p className="text-sm text-slate-500">
                            {getCategoryName(category, "en")}
                          </p>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                          type="button"
                          onClick={() => startEditing(category)}
                        >
                          {t("edit")}
                        </button>
                      )}
                    </div>
                    {category.translations.find((item) => item.locale === "en")
                      ?.description && (
                      <p className="mt-3 text-sm leading-relaxed text-slate-500">
                        {
                          category.translations.find((item) => item.locale === "en")
                            ?.description
                        }
                      </p>
                    )}
                  </>
                )}
              </article>
            ))}
          </div>
        )}
        {saveMessage && <p className="mt-4 text-sm text-amber-700">{saveMessage}</p>}
      </section>

      {/* Tests, Standards & Regulations Reference Section */}
      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-extrabold tracking-[0.11em] text-slate-500 uppercase">
              {t("knowledgeCatalogue")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("testsCatalogue")}
            </h2>
          </div>
          {isAdmin && !newTestDraft && (
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
              onClick={() =>
                setNewTestDraft({ code: "", name: "", method: "", unit: "" })
              }
            >
              + Test
            </button>
          )}
        </div>

        {newTestDraft && (
          <div className="mb-4 grid gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-4">
            <input
              type="text"
              placeholder="Code (e.g. brake_disc_wear)"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={newTestDraft.code}
              onChange={(e) =>
                setNewTestDraft((prev) =>
                  prev ? { ...prev, code: e.target.value } : prev,
                )
              }
            />
            <input
              type="text"
              placeholder="Name"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={newTestDraft.name}
              onChange={(e) =>
                setNewTestDraft((prev) =>
                  prev ? { ...prev, name: e.target.value } : prev,
                )
              }
            />
            <input
              type="text"
              placeholder="Method"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={newTestDraft.method}
              onChange={(e) =>
                setNewTestDraft((prev) =>
                  prev ? { ...prev, method: e.target.value } : prev,
                )
              }
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"
                onClick={() => void createTestCatalogueRecord()}
              >
                {t("create")}
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                onClick={() => setNewTestDraft(null)}
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-2 text-sm font-bold text-slate-900">
              Regulations ({regulations.length})
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              {regulations.map((reg) => (
                <li key={reg.id}>
                  <strong className="text-slate-900">{reg.code}</strong> — {reg.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-2 text-sm font-bold text-slate-900">
              Standards ({standards.length})
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              {standards.map((std) => (
                <li key={std.id}>
                  <strong className="text-slate-900">{std.code}</strong> — {std.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-2 text-sm font-bold text-slate-900">
              Tests ({testsCatalogue.length})
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              {testsCatalogue.map((testItem) => (
                <li key={testItem.id}>
                  <strong className="text-slate-900">{testItem.name}</strong> (
                  {testItem.code})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {auditState !== "hidden" && (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-extrabold tracking-[0.11em] text-slate-500 uppercase">
                {t("reviewAndPublish")}
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {t("auditHistory")}
              </h2>
            </div>
          </div>

          {auditState === "loading" && (
            <p className="text-slate-500">{t("loadingCatalogue")}</p>
          )}
          {auditState === "error" && (
            <p className="text-rose-700">{t("auditUnavailable")}</p>
          )}
          {auditState === "ready" && auditEvents.length === 0 && (
            <p className="text-slate-500">{t("noAuditEvents")}</p>
          )}
          {auditState === "ready" && auditEvents.length > 0 && (
            <div className="divide-y divide-slate-200">
              {auditEvents.map((event) => (
                <article
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                  key={event.id}
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {event.action} {event.entityType}
                    </p>
                    <p className="text-sm text-slate-500">
                      {event.actorEmail}
                      {event.reason ? ` — "${event.reason}"` : ""}
                    </p>
                  </div>
                  <time className="text-sm text-slate-500" dateTime={event.createdAt}>
                    {new Date(event.createdAt).toLocaleString(locale)}
                  </time>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default App;
