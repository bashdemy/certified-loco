import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n, { detectInitialLocale, type Locale } from "../i18n/config";
import { CertificatesTab } from "./components/CertificatesTab";
import { StandardsTab } from "./components/StandardsTab";
import { TutorialBanner } from "./components/TutorialBanner";
import { YearlyCheckTab } from "./components/YearlyCheckTab";
import type {
  ActiveTab,
  AssessmentRecord,
  AuditEvent,
  AuditState,
  AuthState,
  CategoryDraft,
  Certificate,
  CertificateDraft,
  CurrentUser,
  HealthState,
  LoadState,
  ManagedAccount,
  NewCategoryDraft,
  ProductCategory,
  RegulationRecord,
  RegulatoryDataset,
  StandardRecord,
  TestCatalogueItem,
} from "./types";

const locales: Array<{ code: Locale; label: string }> = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "kk", label: "KK" },
];

export default function App() {
  const { t } = useTranslation();
  const [locale, setLocale] = useState<Locale>(() => detectInitialLocale());
  const [activeTab, setActiveTab] = useState<ActiveTab>("check");

  const [authState, setAuthState] = useState<AuthState>("checking");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const [health, setHealth] = useState<HealthState>("checking");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [certificateState, setCertificateState] = useState<LoadState>("loading");
  const [assessmentState, setAssessmentState] = useState<LoadState>("loading");
  const [auditState, setAuditState] = useState<AuditState>("loading");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [managedAccounts, setManagedAccounts] = useState<ManagedAccount[]>([]);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [accountDrafts, setAccountDrafts] = useState<
    Record<
      string,
      {
        email: string;
        displayName: string;
        role: "admin" | "user";
        password: string;
      }
    >
  >({});
  const [savingAccountSlot, setSavingAccountSlot] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [testsCatalogue, setTestsCatalogue] = useState<TestCatalogueItem[]>([]);
  const [standards, setStandards] = useState<StandardRecord[]>([]);
  const [regulations, setRegulations] = useState<RegulationRecord[]>([]);
  const [datasets, setDatasets] = useState<RegulatoryDataset[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);

  const [certificateDraft, setCertificateDraft] = useState<CertificateDraft | null>(null);
  const [creatingCertificate, setCreatingCertificate] = useState(false);
  const [certificateMessage, setCertificateMessage] = useState<string | null>(null);
  const [uploadingRevisionId, setUploadingRevisionId] = useState<string | null>(null);

  const [selectedRevisionId, setSelectedRevisionId] = useState("");
  const [assessmentDate, setAssessmentDate] = useState("2026-06-01");
  const [runningAssessment, setRunningAssessment] = useState(false);
  const [assessmentMessage, setAssessmentMessage] = useState<string | null>(null);

  const isAdmin = currentUser?.role === "admin";

  const changeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    void i18n.changeLanguage(nextLocale);
    try {
      window.localStorage.setItem("certified-loco:locale", nextLocale);
    } catch {
      // ignore storage errors
    }
  };

  const loadWorkspaceData = useCallback(async () => {
    try {
      const [healthResponse, meResponse] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/me"),
      ]);

      if (healthResponse.ok) {
        setHealth("ok");
        const healthBody = (await healthResponse.json().catch(() => null)) as {
          defaultLocale?: Locale;
        } | null;
        try {
          const saved = window.localStorage.getItem("certified-loco:locale");
          if (
            !saved &&
            healthBody?.defaultLocale &&
            (healthBody.defaultLocale === "en" ||
              healthBody.defaultLocale === "ru" ||
              healthBody.defaultLocale === "kk")
          ) {
            setLocale(healthBody.defaultLocale);
            void i18n.changeLanguage(healthBody.defaultLocale);
          }
        } catch {
          // ignore
        }
      } else {
        setHealth("error");
      }

      if (meResponse.status === 401) {
        setAuthState("unauthenticated");
        setCurrentUser(null);
        return;
      }

      if (!meResponse.ok) {
        setAuthState("unauthenticated");
        return;
      }

      const meBody = (await meResponse.json()) as { data: CurrentUser };
      setCurrentUser(meBody.data);
      setAuthState("authenticated");
      if (meBody.data.slot === "dad") {
        setLocale("ru");
        void i18n.changeLanguage("ru");
        setShowTutorial(true);
      }

      const [
        categoriesResponse,
        certificatesResponse,
        catalogueResponse,
        datasetsResponse,
        assessmentsResponse,
      ] = await Promise.all([
        fetch("/api/product-categories"),
        fetch("/api/certificates"),
        fetch("/api/catalogue"),
        fetch("/api/regulatory-datasets"),
        fetch("/api/assessments"),
      ]);

      if (categoriesResponse.ok) {
        const body = (await categoriesResponse.json()) as {
          data: ProductCategory[];
        };
        setCategories(body.data);
        setLoadState("ready");
      } else {
        setLoadState("error");
      }

      if (certificatesResponse.ok) {
        const body = (await certificatesResponse.json()) as {
          data: Certificate[];
        };
        setCertificates(body.data);
        setCertificateState("ready");
        setSelectedRevisionId((prev) => {
          if (prev && body.data.some((c) => c.revisionId === prev)) {
            return prev;
          }
          return body.data[0]?.revisionId ?? "";
        });
      } else {
        setCertificateState("error");
      }

      if (catalogueResponse.ok) {
        const body = (await catalogueResponse.json()) as {
          data: {
            tests: TestCatalogueItem[];
            standards: StandardRecord[];
            regulations: RegulationRecord[];
          };
        };
        setTestsCatalogue(body.data.tests);
        setStandards(body.data.standards);
        setRegulations(body.data.regulations);
      }

      if (datasetsResponse.ok) {
        const body = (await datasetsResponse.json()) as {
          data: RegulatoryDataset[];
        };
        setDatasets(body.data);
      }

      if (assessmentsResponse.ok) {
        const body = (await assessmentsResponse.json()) as {
          data: AssessmentRecord[];
        };
        setAssessments(body.data);
        setAssessmentState("ready");
      } else {
        setAssessmentState("error");
      }

      if (meBody.data.role === "admin") {
        const [auditRes, usersRes] = await Promise.all([
          fetch("/api/audit-events?limit=15"),
          fetch("/api/users"),
        ]);
        if (auditRes.ok) {
          const auditBody = (await auditRes.json()) as { data: AuditEvent[] };
          setAuditEvents(auditBody.data);
          setAuditState("ready");
        } else {
          setAuditState("error");
        }
        if (usersRes.ok) {
          const usersBody = (await usersRes.json()) as {
            data: ManagedAccount[];
          };
          setManagedAccounts(usersBody.data);
          const nextDrafts: typeof accountDrafts = {};
          for (const acc of usersBody.data) {
            nextDrafts[acc.slot] = {
              email: acc.email,
              displayName: acc.displayName,
              role: acc.role,
              password: "",
            };
          }
          setAccountDrafts(nextDrafts);
        }
      } else {
        setAuditState("hidden");
      }
    } catch {
      setHealth("error");
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadWorkspaceData();
  }, [loadWorkspaceData]);

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setSigningIn(true);
    setLoginError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (!response.ok) {
        setLoginError(t("invalidCredentials"));
        return;
      }
      setLoginPassword("");
      await loadWorkspaceData();
    } catch {
      setLoginError(t("invalidCredentials"));
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setAuthState("unauthenticated");
  };

  const saveAccountSlot = async (slot: "owner" | "dad") => {
    const draft = accountDrafts[slot];
    if (!draft) return;
    setSavingAccountSlot(slot);
    setAccountMessage(null);
    try {
      const response = await fetch(`/api/users/${slot}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: draft.email,
          displayName: draft.displayName,
          role: draft.role,
          password: draft.password.trim() || undefined,
        }),
      });
      if (response.ok) {
        setAccountMessage(t("accountUpdated"));
        await loadWorkspaceData();
      }
    } finally {
      setSavingAccountSlot(null);
    }
  };

  const runAssessment = async () => {
    if (!selectedRevisionId) return;
    setRunningAssessment(true);
    setAssessmentMessage(null);
    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          certificateRevisionId: selectedRevisionId,
          assessmentDate,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setAssessmentMessage(body?.error?.message ?? t("saveFailed"));
        return;
      }
      await loadWorkspaceData();
    } finally {
      setRunningAssessment(false);
    }
  };

  const startNewCertificate = () => {
    setCertificateMessage(null);
    setCertificateDraft({
      certificateNumber: "ЕАЭС KZ.7500001.01.01.",
      productCategoryId: categories[0]?.id ?? "",
      productName: "",
      productModel: "",
      manufacturer: "",
      applicant: "",
      regulationCode: "ТР ТС 001/2011",
      certificationScheme: "3с",
      issuedAt: "2023-05-15",
      expiresAt: "2028-05-14",
      confirmed: true,
    });
  };

  const createCertificate = async () => {
    if (!certificateDraft) return;
    setCreatingCertificate(true);
    setCertificateMessage(null);
    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...certificateDraft,
          productModel: certificateDraft.productModel || null,
          applicant: certificateDraft.applicant || null,
          certificationScheme: certificateDraft.certificationScheme || null,
          issuedAt: certificateDraft.issuedAt || null,
          expiresAt: certificateDraft.expiresAt || null,
        }),
      });
      if (!response.ok) {
        setCertificateMessage(t("certificateFailed"));
        return;
      }
      const created = (await response.json().catch(() => null)) as {
        data?: Certificate;
      } | null;
      setCertificateDraft(null);
      setCertificateMessage(t("certificateCreated"));
      await loadWorkspaceData();
      if (created?.data?.revisionId) {
        setSelectedRevisionId(created.data.revisionId);
      }
    } finally {
      setCreatingCertificate(false);
    }
  };

  const confirmRevision = async (revisionId: string) => {
    const response = await fetch(`/api/certificate-revisions/${revisionId}/confirm`, {
      method: "POST",
    });
    if (response.ok) {
      await loadWorkspaceData();
    }
  };

  const uploadCertificateDocument = async (certificate: Certificate, file: File) => {
    setUploadingRevisionId(certificate.revisionId);
    setCertificateMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `/api/certificates/${certificate.id}/revisions/${certificate.revisionId}/documents`,
        {
          method: "POST",
          body: formData,
        },
      );
      setCertificateMessage(
        response.ok ? t("documentUploaded") : t("documentUploadFailed"),
      );
    } finally {
      setUploadingRevisionId(null);
    }
  };

  const addRevisionTest = async (
    revisionId: string,
    payload: {
      testId: string;
      standardVersionId: string;
      standardClause: string;
      parameters: Record<string, unknown>;
      protocolNumber: string;
    },
  ) => {
    const response = await fetch(`/api/certificate-revisions/${revisionId}/tests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        testId: payload.testId,
        standardVersionId: payload.standardVersionId || null,
        standardClause: payload.standardClause || null,
        parameters: payload.parameters,
        protocolNumber: payload.protocolNumber || null,
      }),
    });
    if (response.ok) {
      await loadWorkspaceData();
    }
  };

  if (authState === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-blue-400 uppercase">
                {t("appName")}
              </p>
              <h1 className="mt-1 text-xl font-bold text-white">{t("signInTitle")}</h1>
            </div>
            <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-800 p-1">
              {locales.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => changeLocale(item.code)}
                  className={`rounded px-2 py-1 text-xs font-semibold ${
                    locale === item.code
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mb-6 text-sm text-slate-400">{t("signInSubtitle")}</p>

          {loginError && (
            <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-950/60 px-3 py-2 text-xs text-rose-200">
              {loginError}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <label className="block text-xs font-medium text-slate-300">
              {t("emailLabel")}
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="bashdemy@gmail.com"
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="block text-xs font-medium text-slate-300">
              {t("passwordLabel")}
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={signingIn}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {signingIn ? t("signingIn") : t("signInButton")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Clean Header */}
      <header className="border-b border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-blue-400 uppercase">
                {t("appEyebrow")}
              </p>
              <h1 className="mt-1 text-xl font-bold sm:text-2xl">{t("headline")}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex rounded-lg border border-slate-700 bg-slate-800 p-1">
                {locales.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => changeLocale(item.code)}
                    className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                      locale === item.code
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  health === "ok"
                    ? "bg-emerald-950 text-emerald-300 ring-1 ring-emerald-700"
                    : "bg-rose-950 text-rose-300"
                }`}
              >
                {health === "ok" ? t("apiConnected") : t("apiUnavailable")}
              </span>

              {currentUser && (
                <span className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-200">
                  {currentUser.displayName ?? currentUser.email}
                </span>
              )}

              <button
                type="button"
                onClick={() => setShowTutorial((v) => !v)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  showTutorial
                    ? "border-amber-400 bg-amber-500 text-slate-950"
                    : "border-amber-500/60 bg-slate-800 text-amber-300 hover:bg-slate-700"
                }`}
              >
                {locale === "ru" || currentUser?.slot === "dad"
                  ? "💡 Подсказки (Как работать)"
                  : "💡 Guide & Tips"}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAccountSettings((v) => !v)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  {t("manageAccounts")}
                </button>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg border border-rose-800/70 bg-rose-950/60 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-900/60"
              >
                {t("signOutButton")}
              </button>
            </div>
          </div>

          {/* 3-Tab Navigation Bar */}
          <nav className="mt-5 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
            {(
              [
                { id: "check", label: t("tabYearlyCheck") },
                {
                  id: "certificates",
                  label: `${t("tabCertificates")} (${certificates.length})`,
                },
                { id: "norms", label: t("tabNorms") },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {showTutorial && (
          <TutorialBanner
            activeTab={activeTab}
            locale={locale}
            isDad={currentUser?.slot === "dad"}
            onDismiss={() => setShowTutorial(false)}
            onSwitchTab={setActiveTab}
          />
        )}

        {/* Team Accounts Drawer */}
        {isAdmin && showAccountSettings && (
          <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {t("manageAccounts")}
                </h2>
                <p className="text-xs text-slate-600">{t("accountSettingsSubtitle")}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountSettings(false)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            {accountMessage && (
              <p className="mt-2 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-900">
                {accountMessage}
              </p>
            )}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {(["owner", "dad"] as const).map((slot) => {
                const draft = accountDrafts[slot];
                if (!draft) return null;
                return (
                  <div
                    key={slot}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
                  >
                    <h3 className="text-sm font-semibold text-slate-900">
                      {slot === "owner"
                        ? t("accountOwnerHeading")
                        : t("accountDadHeading")}
                    </h3>
                    <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                      <label className="block text-xs text-slate-600">
                        {t("accountNameLabel")}
                        <input
                          type="text"
                          value={draft.displayName}
                          onChange={(e) =>
                            setAccountDrafts({
                              ...accountDrafts,
                              [slot]: { ...draft, displayName: e.target.value },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </label>
                      <label className="block text-xs text-slate-600">
                        {t("emailLabel")}
                        <input
                          type="email"
                          value={draft.email}
                          onChange={(e) =>
                            setAccountDrafts({
                              ...accountDrafts,
                              [slot]: { ...draft, email: e.target.value },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </label>
                      <label className="block text-xs text-slate-600 sm:col-span-2">
                        {t("accountNewPasswordLabel")}
                        <input
                          type="password"
                          value={draft.password}
                          onChange={(e) =>
                            setAccountDrafts({
                              ...accountDrafts,
                              [slot]: { ...draft, password: e.target.value },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      disabled={savingAccountSlot === slot}
                      onClick={() => void saveAccountSlot(slot)}
                      className="mt-3 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      {savingAccountSlot === slot ? t("saving") : t("save")}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tab 1: Check Certificate for This Year */}
        {activeTab === "check" && (
          <YearlyCheckTab
            locale={locale}
            certificates={certificates}
            categories={categories}
            datasets={datasets}
            assessments={assessments}
            assessmentState={assessmentState}
            selectedRevisionId={selectedRevisionId}
            onSelectRevisionId={setSelectedRevisionId}
            assessmentDate={assessmentDate}
            onChangeAssessmentDate={setAssessmentDate}
            runningAssessment={runningAssessment}
            assessmentMessage={assessmentMessage}
            onRunAssessment={runAssessment}
          />
        )}

        {/* Tab 2: Past Certificates & Protocols */}
        {activeTab === "certificates" && (
          <CertificatesTab
            locale={locale}
            isAdmin={isAdmin}
            certificates={certificates}
            certificateState={certificateState}
            categories={categories}
            testsCatalogue={testsCatalogue}
            standards={standards}
            certificateDraft={certificateDraft}
            creatingCertificate={creatingCertificate}
            certificateMessage={certificateMessage}
            uploadingRevisionId={uploadingRevisionId}
            onStartCertificate={startNewCertificate}
            onCancelCertificate={() => setCertificateDraft(null)}
            onUpdateCertificateDraft={(field, value) =>
              setCertificateDraft((prev) => (prev ? { ...prev, [field]: value } : null))
            }
            onCreateCertificate={createCertificate}
            onConfirmRevision={confirmRevision}
            onUploadDocument={uploadCertificateDocument}
            onAddRevisionTest={addRevisionTest}
            onJumpToCheck={(revisionId) => {
              setSelectedRevisionId(revisionId);
              setActiveTab("check");
            }}
          />
        )}

        {/* Tab 3: ТР ТС & ГОСТ Standards Base */}
        {activeTab === "norms" && (
          <StandardsTab
            locale={locale}
            isAdmin={isAdmin}
            loadState={loadState}
            datasets={datasets}
            categories={categories}
            testsCatalogue={testsCatalogue}
            standards={standards}
            regulations={regulations}
            auditState={auditState}
            auditEvents={auditEvents}
            onReviewRequirement={async (datasetId, requirementId, status) => {
              await fetch(
                `/api/regulatory-datasets/${datasetId}/requirements/${requirementId}`,
                {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ reviewStatus: status }),
                },
              );
              await loadWorkspaceData();
            }}
            onPublishDataset={async (datasetId, reason) => {
              const target = datasets.find((d) => d.id === datasetId);
              await fetch(`/api/regulatory-datasets/${datasetId}/publish`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  version: target?.version ?? 1,
                  reason: reason || "Published under RK & EAEU norms",
                }),
              });
              await loadWorkspaceData();
            }}
            onCreateCategory={async (draft) => {
              await fetch("/api/product-categories", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  code: draft.code,
                  translations: [
                    {
                      locale: "en",
                      name: draft.enName,
                      description: draft.description || null,
                    },
                    {
                      locale: "ru",
                      name: draft.ruName,
                      description: draft.description || null,
                    },
                    {
                      locale: "kk",
                      name: draft.kkName,
                      description: draft.description || null,
                    },
                  ],
                }),
              });
              await loadWorkspaceData();
            }}
            onSaveCategory={async (draft) => {
              await fetch(`/api/product-categories/${draft.id}`, {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  version: draft.version,
                  translations: draft.translations,
                }),
              });
              await loadWorkspaceData();
            }}
            onDeleteCategory={async (category) => {
              await fetch(
                `/api/product-categories/${category.id}?version=${category.version}`,
                { method: "DELETE" },
              );
              await loadWorkspaceData();
            }}
            onCreateTest={async (payload) => {
              await fetch("/api/catalogue/tests", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  code: payload.code,
                  name: payload.name,
                  method: payload.method || null,
                }),
              });
              await loadWorkspaceData();
            }}
          />
        )}
      </main>
    </div>
  );
}
