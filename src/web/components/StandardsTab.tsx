import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getLocalizedName } from "../../domain/product-category-translations";
import {
  formatParametersLocalized,
  localizeDomainText,
  type Locale,
} from "../../i18n/config";
import type {
  AuditEvent,
  AuditState,
  CategoryDraft,
  LoadState,
  NewCategoryDraft,
  ProductCategory,
  RegulationRecord,
  RegulatoryDataset,
  StandardRecord,
  TestCatalogueItem,
} from "../types";

type StandardsTabProps = {
  locale: Locale;
  isAdmin: boolean;
  loadState: LoadState;
  datasets: RegulatoryDataset[];
  categories: ProductCategory[];
  testsCatalogue: TestCatalogueItem[];
  standards: StandardRecord[];
  regulations: RegulationRecord[];
  auditState: AuditState;
  auditEvents: AuditEvent[];
  onReviewRequirement: (
    datasetId: string,
    requirementId: string,
    status: "approved" | "rejected",
  ) => Promise<void>;
  onPublishDataset: (datasetId: string, reason: string) => Promise<void>;
  onCreateCategory: (draft: NewCategoryDraft) => Promise<void>;
  onSaveCategory: (draft: CategoryDraft) => Promise<void>;
  onDeleteCategory: (category: ProductCategory) => Promise<void>;
  onCreateTest: (payload: {
    code: string;
    name: string;
    method: string;
  }) => Promise<void>;
};

export function StandardsTab({
  locale,
  isAdmin,
  loadState,
  datasets,
  categories,
  testsCatalogue,
  standards,
  regulations,
  auditState,
  auditEvents,
  onReviewRequirement,
  onPublishDataset,
  onCreateCategory,
  onSaveCategory,
  onDeleteCategory,
  onCreateTest,
}: StandardsTabProps) {
  const { t } = useTranslation();
  const [publishReason, setPublishReason] = useState("");
  const [publishingDatasetId, setPublishingDatasetId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<CategoryDraft | null>(null);
  const [newCategoryDraft, setNewCategoryDraft] = useState<NewCategoryDraft | null>(null);
  const [newTestDraft, setNewTestDraft] = useState<{
    code: string;
    name: string;
    method: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-6">
      {/* 1. Regulatory Datasets (ТР ТС 001/2011 & ГОСТ) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("regulatoryDatasets")}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {t("reviewAndPublishDescription")}
          </p>
        </div>

        <div className="space-y-4">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-blue-700">
                      {dataset.code} (v{dataset.datasetVersion})
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        dataset.status === "published"
                          ? "bg-emerald-100 text-emerald-800"
                          : dataset.status === "superseded"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {dataset.status === "published"
                        ? t("publishedLockedNotice")
                        : dataset.status === "superseded"
                          ? t("supersededNotice")
                          : t("draftNotice")}
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">
                    {localizeDomainText(dataset.title, locale)}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {localizeDomainText(dataset.regulationCode, locale)} ·{" "}
                    {t("effectivePeriodLabel")} {dataset.effectiveFrom.slice(0, 10)} →{" "}
                    {dataset.effectiveTo
                      ? dataset.effectiveTo.slice(0, 10)
                      : t("openEndedLabel")}
                  </p>
                </div>

                {isAdmin && dataset.status !== "published" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={publishReason}
                      onChange={(e) => setPublishReason(e.target.value)}
                      placeholder={t("publishReasonPlaceholder")}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                    />
                    <button
                      type="button"
                      disabled={publishingDatasetId === dataset.id}
                      onClick={async () => {
                        setPublishingDatasetId(dataset.id);
                        try {
                          await onPublishDataset(dataset.id, publishReason);
                          setPublishReason("");
                        } finally {
                          setPublishingDatasetId(null);
                        }
                      }}
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {publishingDatasetId === dataset.id
                        ? t("publishing")
                        : t("publishDataset")}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                {dataset.requirements.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                          {req.productCategoryCode}
                        </span>{" "}
                        {localizeDomainText(req.testName, locale)}
                      </div>
                      <div className="text-slate-600">
                        {localizeDomainText(req.standardCode, locale)} (
                        {req.standardVersionLabel}){" "}
                        {localizeDomainText(req.standardClause, locale)} ·{" "}
                        {localizeDomainText(req.provision, locale)}
                      </div>
                      <div className="font-medium text-slate-700">
                        {formatParametersLocalized(req.parameters, locale)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {t("sourceCitationLabel")}{" "}
                        {localizeDomainText(req.sourceReference, locale)} (
                        {localizeDomainText(req.sourcePageSection, locale)})
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                          req.reviewStatus === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : req.reviewStatus === "rejected"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {t(`reviewStatus_${req.reviewStatus}`)}
                      </span>
                      {isAdmin && dataset.status !== "published" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void onReviewRequirement(dataset.id, req.id, "approved")
                            }
                            className="rounded border border-emerald-300 px-2 py-0.5 text-[11px] text-emerald-700 hover:bg-emerald-50"
                          >
                            {t("approveRequirement")}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void onReviewRequirement(dataset.id, req.id, "rejected")
                            }
                            className="rounded border border-rose-300 px-2 py-0.5 text-[11px] text-rose-700 hover:bg-rose-50"
                          >
                            {t("rejectRequirement")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. ГОСТ Standards, Technical Regulations & Laboratory Tests */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{t("testsCatalogue")}</h2>
          {isAdmin && !newTestDraft && (
            <button
              type="button"
              onClick={() => setNewTestDraft({ code: "", name: "", method: "" })}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              {t("addTestButton")}
            </button>
          )}
        </div>

        {newTestDraft && (
          <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-4">
            <input
              type="text"
              placeholder={t("testCodePlaceholder")}
              value={newTestDraft.code}
              onChange={(e) => setNewTestDraft({ ...newTestDraft, code: e.target.value })}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
            />
            <input
              type="text"
              placeholder={t("testNamePlaceholder")}
              value={newTestDraft.name}
              onChange={(e) => setNewTestDraft({ ...newTestDraft, name: e.target.value })}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
            />
            <input
              type="text"
              placeholder={t("testMethodPlaceholder")}
              value={newTestDraft.method}
              onChange={(e) =>
                setNewTestDraft({ ...newTestDraft, method: e.target.value })
              }
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  await onCreateTest(newTestDraft);
                  setNewTestDraft(null);
                }}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
              >
                {t("create")}
              </button>
              <button
                type="button"
                onClick={() => setNewTestDraft(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              {t("regulationsHeading")} ({regulations.length})
            </h3>
            <ul className="mt-2 space-y-2 text-xs">
              {regulations.map((reg) => (
                <li
                  key={reg.id}
                  className="rounded-lg border border-slate-200 bg-white p-2.5"
                >
                  <div className="font-semibold text-slate-900">
                    {localizeDomainText(reg.code, locale)}
                  </div>
                  <div className="text-slate-600">
                    {localizeDomainText(reg.name, locale)}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              {t("standardsHeading")} ({standards.length})
            </h3>
            <ul className="mt-2 space-y-2 text-xs">
              {standards.map((std) => (
                <li
                  key={std.id}
                  className="rounded-lg border border-slate-200 bg-white p-2.5"
                >
                  <div className="font-semibold text-slate-900">
                    {localizeDomainText(std.code, locale)}
                  </div>
                  <div className="text-slate-600">
                    {localizeDomainText(std.name, locale)}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              {t("testsHeading")} ({testsCatalogue.length})
            </h3>
            <ul className="mt-2 space-y-2 text-xs">
              {testsCatalogue.map((test) => (
                <li
                  key={test.id}
                  className="rounded-lg border border-slate-200 bg-white p-2.5"
                >
                  <div className="font-semibold text-slate-900">
                    {localizeDomainText(test.name, locale)}
                  </div>
                  <div className="text-slate-500">
                    {localizeDomainText(test.method ?? "—", locale)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Rolling Stock Component Categories */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {t("productCategories")}
            </h2>
            <p className="text-xs text-slate-500">
              {categories.length} {t("records")}
            </p>
          </div>
          {isAdmin && !newCategoryDraft && (
            <button
              type="button"
              onClick={() =>
                setNewCategoryDraft({
                  code: "",
                  enName: "",
                  ruName: "",
                  kkName: "",
                  description: "",
                })
              }
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              {t("newCategory")}
            </button>
          )}
        </div>

        {newCategoryDraft && (
          <div className="mt-4 rounded-xl border border-slate-300 bg-slate-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-slate-700">
                {t("categoryCode")}
                <input
                  type="text"
                  value={newCategoryDraft.code}
                  onChange={(e) =>
                    setNewCategoryDraft({
                      ...newCategoryDraft,
                      code: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                {t("englishName")}
                <input
                  type="text"
                  value={newCategoryDraft.enName}
                  onChange={(e) =>
                    setNewCategoryDraft({
                      ...newCategoryDraft,
                      enName: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                {t("russianName")}
                <input
                  type="text"
                  value={newCategoryDraft.ruName}
                  onChange={(e) =>
                    setNewCategoryDraft({
                      ...newCategoryDraft,
                      ruName: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                {t("kazakhName")}
                <input
                  type="text"
                  value={newCategoryDraft.kkName}
                  onChange={(e) =>
                    setNewCategoryDraft({
                      ...newCategoryDraft,
                      kkName: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                />
              </label>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onCreateCategory(newCategoryDraft);
                    setNewCategoryDraft(null);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
              >
                {t("create")}
              </button>
              <button
                type="button"
                onClick={() => setNewCategoryDraft(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}

        {loadState === "ready" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {categories.map((category) => {
              const isEditing = editingDraft?.id === category.id;
              const activeTranslation =
                category.translations.find((tr) => tr.locale === locale) ??
                category.translations[0];

              return (
                <div
                  key={category.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-semibold text-blue-700">
                        {category.code}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {getLocalizedName(category.translations, locale)}
                      </h3>
                      {activeTranslation?.description && (
                        <p className="mt-1 text-xs text-slate-600">
                          {localizeDomainText(activeTranslation.description, locale)}
                        </p>
                      )}
                    </div>
                    {isAdmin && !isEditing && (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingDraft({
                              id: category.id,
                              version: category.version,
                              translations: category.translations.map((tr) => ({
                                ...tr,
                              })),
                            })
                          }
                          className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          {t("edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDeleteCategory(category)}
                          className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-100"
                        >
                          {t("archive")}
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing && editingDraft && (
                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                      {editingDraft.translations.map((tr) => (
                        <input
                          key={tr.locale}
                          type="text"
                          value={tr.name}
                          onChange={(e) =>
                            setEditingDraft({
                              ...editingDraft,
                              translations: editingDraft.translations.map((item) =>
                                item.locale === tr.locale
                                  ? { ...item, name: e.target.value }
                                  : item,
                              ),
                            })
                          }
                          className="w-full rounded border border-slate-300 bg-white px-2.5 py-1 text-xs"
                        />
                      ))}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await onSaveCategory(editingDraft);
                            setEditingDraft(null);
                          }}
                          className="rounded bg-slate-900 px-3 py-1 text-xs text-white"
                        >
                          {t("save")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingDraft(null)}
                          className="rounded border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700"
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Audit History */}
      {isAdmin && auditState === "ready" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{t("auditHistory")}</h2>
          {auditEvents.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">{t("noAuditEvents")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-200 text-xs">
              {auditEvents.slice(0, 10).map((evt) => (
                <li
                  key={evt.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <div>
                    <span className="font-semibold text-slate-900">{evt.action}</span>{" "}
                    <span className="text-slate-600">
                      · {evt.entityType} ({evt.entityId.slice(0, 8)})
                    </span>
                  </div>
                  <div className="text-slate-500">
                    {evt.actorEmail} · {new Date(evt.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
