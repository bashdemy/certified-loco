import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLocalizedName } from "../domain/product-category-translations";
import i18n, { type Locale } from "../i18n/config";

type HealthState = "checking" | "ok" | "error";
type CatalogueState = "loading" | "ready" | "error";
type AuditState = "loading" | "ready" | "error" | "hidden";
type CertificateState = "loading" | "ready" | "error";

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

type AuditEvent = {
  id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  requestId: string;
  createdAt: string;
};

type Certificate = {
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
  createdAt: string;
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
};

const healthStyles: Record<HealthState, string> = {
  checking: "bg-amber-100 text-amber-900",
  ok: "bg-emerald-100 text-emerald-900",
  error: "bg-rose-100 text-rose-900",
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
  const [catalogueState, setCatalogueState] = useState<CatalogueState>("loading");
  const [auditState, setAuditState] = useState<AuditState>("loading");
  const [certificateState, setCertificateState] = useState<CertificateState>("loading");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [locale, setLocale] = useState<Locale>((i18n.language as Locale) || "en");
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [certificateDraft, setCertificateDraft] = useState<CertificateDraft | null>(null);
  const [creatingCertificate, setCreatingCertificate] = useState(false);
  const [certificateMessage, setCertificateMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((response) => {
        if (!response.ok) throw new Error("Health check failed");
        setHealth("ok");
      })
      .catch(() => setHealth("error"));

    fetch("/api/product-categories")
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalogue request failed");
        const result = (await response.json()) as {
          data: ProductCategory[];
        };
        setCategories(result.data);
        setCatalogueState("ready");
      })
      .catch(() => setCatalogueState("error"));

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

    fetch("/api/certificates")
      .then(async (response) => {
        if (!response.ok) throw new Error("Certificates request failed");
        const result = (await response.json()) as { data: Certificate[] };
        setCertificates(result.data);
        setCertificateState("ready");
      })
      .catch(() => setCertificateState("error"));
  }, []);

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
      certificationScheme: "",
      issuedAt: "",
      expiresAt: "",
    });
  };

  const updateCertificateDraft = (field: keyof CertificateDraft, value: string) => {
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
      setCertificateDraft(null);
      setCertificateMessage(t("certificateCreated"));
    } catch {
      setCertificateMessage(t("certificateFailed"));
    } finally {
      setCreatingCertificate(false);
    }
  };

  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-6xl bg-slate-50 py-8 pb-16 text-slate-900 sm:py-12">
      <header className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="mb-2 text-xs font-extrabold tracking-[0.11em] text-slate-500 uppercase">
            {t("appEyebrow")}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("appName")}
          </h1>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span
            className={`rounded-full px-3 py-2 text-xs font-extrabold ${healthStyles[health]}`}
          >
            {health === "checking" && t("checkingApi")}
            {health === "ok" && t("apiConnected")}
            {health === "error" && t("apiUnavailable")}
          </span>
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
        <button
          className="cursor-not-allowed rounded-[10px] bg-blue-600 px-4 py-3 font-bold text-white opacity-60"
          type="button"
          disabled
        >
          {t("newAssessment")}
        </button>
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

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-extrabold tracking-[0.11em] text-slate-500 uppercase">
              {t("knowledgeCatalogue")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("certificates")}
            </h2>
          </div>
          {!certificateDraft && (
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
                  value={certificateDraft[field]}
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
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">
                    v{certificate.revisionNumber}
                  </span>
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
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-extrabold tracking-[0.11em] text-slate-500 uppercase">
              {t("connectedData")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("productCategories")}
            </h2>
          </div>
          <span className="text-sm text-slate-500">
            {catalogueState === "ready" ? `${categories.length} ${t("records")}` : ""}
          </span>
        </div>

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
                      <button
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                        type="button"
                        onClick={() => startEditing(category)}
                      >
                        {t("edit")}
                      </button>
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
                    <p className="text-sm text-slate-500">{event.actorEmail}</p>
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
