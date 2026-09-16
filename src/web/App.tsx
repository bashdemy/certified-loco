import { useEffect, useState } from "react";

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

function App() {
  const [health, setHealth] = useState<HealthState>("checking");
  const [catalogueState, setCatalogueState] = useState<CatalogueState>("loading");
  const [categories, setCategories] = useState<ProductCategory[]>([]);

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

  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-6xl bg-slate-50 py-8 pb-16 text-slate-900 sm:py-12">
      <header className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="mb-2 text-xs font-extrabold tracking-[0.11em] text-slate-500 uppercase">
            Railway certification workspace
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Certified Loco
          </h1>
        </div>
        <span
          className={`rounded-full px-3 py-2 text-xs font-extrabold ${healthStyles[health]}`}
        >
          {health === "checking" && "Checking API"}
          {health === "ok" && "API connected"}
          {health === "error" && "API unavailable"}
        </span>
      </header>

      <section className="mb-4 rounded-[22px] bg-slate-900 p-6 text-slate-100 shadow-xl sm:p-12">
        <p className="mb-2 text-xs font-extrabold tracking-[0.11em] text-slate-400 uppercase">
          First release
        </p>
        <h2 className="mb-4 max-w-3xl text-4xl leading-tight font-bold tracking-[-0.04em] text-white sm:text-6xl">
          Certification assessments with evidence you can review.
        </h2>
        <p className="mb-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Start with a confirmed certificate, compare historical tests with the published
          regulatory dataset, and keep the source behind every result.
        </p>
        <button
          className="cursor-not-allowed rounded-[10px] bg-blue-600 px-4 py-3 font-bold text-white opacity-60"
          type="button"
          disabled
        >
          New assessment — coming next
        </button>
      </section>

      <section className="mb-4 grid gap-4 sm:grid-cols-3" aria-label="Application areas">
        <article className="min-h-44 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="mb-8 block text-xs font-extrabold text-blue-600">01</span>
          <h3 className="mb-2 text-lg font-bold text-slate-900">Assessments</h3>
          <p className="leading-relaxed text-slate-500">
            Compare a part&apos;s historical programme with current requirements.
          </p>
        </article>
        <article className="min-h-44 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="mb-8 block text-xs font-extrabold text-blue-600">02</span>
          <h3 className="mb-2 text-lg font-bold text-slate-900">Knowledge catalogue</h3>
          <p className="leading-relaxed text-slate-500">
            Maintain parts, tests, standards, regulations and certificates.
          </p>
        </article>
        <article className="min-h-44 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="mb-8 block text-xs font-extrabold text-blue-600">03</span>
          <h3 className="mb-2 text-lg font-bold text-slate-900">Review and publish</h3>
          <p className="leading-relaxed text-slate-500">
            Approve regulatory changes before users can rely on them.
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-extrabold tracking-[0.11em] text-slate-500 uppercase">
              Connected data
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Product categories
            </h2>
          </div>
          <span className="text-sm text-slate-500">
            {catalogueState === "ready" ? `${categories.length} records` : ""}
          </span>
        </div>

        {catalogueState === "loading" && (
          <p className="text-slate-500">Loading catalogue…</p>
        )}
        {catalogueState === "error" && (
          <p className="text-rose-700">
            Catalogue unavailable. Check the local database connection.
          </p>
        )}
        {catalogueState === "ready" && categories.length === 0 && (
          <p className="text-slate-500">No product categories have been seeded yet.</p>
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
                  {category.nameEn}
                </h3>
                <p className="text-sm text-slate-500">{category.nameRu}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
