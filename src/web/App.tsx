import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n, { type Locale } from "../i18n/config";

type HealthState = "checking" | "ok" | "error";
type CatalogueState = "loading" | "ready" | "error";

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
  return (
    category.translations.find((translation) => translation.locale === locale)?.name ??
    category.translations.find((translation) => translation.locale === "en")?.name ??
    category.translations[0]?.name ??
    category.code
  );
}

function App() {
  const { t } = useTranslation();
  const [health, setHealth] = useState<HealthState>("checking");
  const [catalogueState, setCatalogueState] = useState<CatalogueState>("loading");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [locale, setLocale] = useState<Locale>((i18n.language as Locale) || "ru");
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
    </main>
  );
}

export default App;
