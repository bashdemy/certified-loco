import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n, { type Locale } from "../i18n/config";

type HealthState = "checking" | "ok" | "error";
type CatalogueState = "loading" | "ready" | "error";

type ProductCategory = {
  id: string;
  code: string;
  nameRu: string;
  nameKk: string;
  nameEn: string;
  description: string | null;
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
  if (locale === "ru") return category.nameRu;
  if (locale === "kk") return category.nameKk;
  return category.nameEn;
}

function App() {
  const { t } = useTranslation();
  const [health, setHealth] = useState<HealthState>("checking");
  const [catalogueState, setCatalogueState] = useState<CatalogueState>("loading");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [locale, setLocale] = useState<Locale>((i18n.language as Locale) || "ru");

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
  }, []);

  const changeLocale = (nextLocale: Locale) => {
    void i18n.changeLanguage(nextLocale);
    setLocale(nextLocale);
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
                <p className="mb-1 text-xs font-extrabold tracking-wide text-blue-600 uppercase">
                  {category.code}
                </p>
                <h3 className="mb-1 text-lg font-bold text-slate-900">
                  {getCategoryName(category, locale)}
                </h3>
                {locale !== "ru" && (
                  <p className="text-sm text-slate-500">{category.nameRu}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
