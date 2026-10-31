import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AssessmentResultState } from "../../domain/assessment-engine";
import { getLocalizedName } from "../../domain/product-category-translations";
import {
  formatParametersLocalized,
  localizeAssessmentReason,
  localizeDomainText,
  type Locale,
} from "../../i18n/config";
import type {
  AssessmentRecord,
  Certificate,
  LoadState,
  ProductCategory,
  RegulatoryDataset,
} from "../types";

const resultStateStyles: Record<AssessmentResultState, string> = {
  required: "bg-emerald-100 text-emerald-900 border border-emerald-200",
  additional: "bg-blue-100 text-blue-900 border border-blue-200",
  changed: "bg-amber-100 text-amber-900 border border-amber-300",
  historical_only: "bg-slate-200 text-slate-800 border border-slate-300",
  review: "bg-rose-100 text-rose-900 border border-rose-200",
};

type Props = {
  locale: Locale;
  certificates: Certificate[];
  categories: ProductCategory[];
  datasets: RegulatoryDataset[];
  assessments: AssessmentRecord[];
  assessmentState: LoadState;
  selectedRevisionId: string;
  onSelectRevisionId: (id: string) => void;
  assessmentDate: string;
  onChangeAssessmentDate: (date: string) => void;
  runningAssessment: boolean;
  assessmentMessage: string | null;
  onRunAssessment: () => void;
};

export function YearlyCheckTab({
  locale,
  certificates,
  categories,
  datasets,
  assessments,
  assessmentState,
  selectedRevisionId,
  onSelectRevisionId,
  assessmentDate,
  onChangeAssessmentDate,
  runningAssessment,
  assessmentMessage,
  onRunAssessment,
}: Props) {
  const { t } = useTranslation();
  const [expandedEvidenceKeys, setExpandedEvidenceKeys] = useState<
    Record<string, boolean>
  >({});

  const toggleEvidence = (key: string) => {
    setExpandedEvidenceKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Show the latest assessment for the currently selected certificate revision (or fallback to all if none selected)
  const filteredAssessments = selectedRevisionId
    ? assessments.filter((a) => a.certificateRevisionId === selectedRevisionId)
    : assessments;
  const displayedAssessments =
    filteredAssessments.length > 0 ? [filteredAssessments[0]] : [];

  return (
    <section
      id="assessments-section"
      className="rounded-2xl border border-[#cde4ee] bg-white p-6 shadow-xs"
    >
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-tight text-[#0c4a6e] sm:text-2xl">
          {t("assessments")}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{t("assessmentsDescription")}</p>
      </div>

      {/* Step 1, Step 2 & Step 3 Selector Bar */}
      <div className="mb-6 grid gap-4 rounded-xl border border-[#bae6fd] bg-gradient-to-r from-[#f0f9ff] via-[#f5fbff] to-[#fffdf5] p-4 sm:grid-cols-12 sm:items-end">
        <label className="block text-sm font-semibold text-[#0c4a6e] sm:col-span-6">
          <span className="mr-1.5 inline-block rounded bg-[#0284c7] px-2 py-0.5 text-[11px] font-bold text-[#fef08a] uppercase">
            {locale === "ru" ? "Шаг 1" : locale === "kk" ? "1-қадам" : "Step 1"}
          </span>
          {t("selectCertificateRevision")}
          <select
            className="mt-1.5 w-full rounded-lg border border-[#93c5fd] bg-white px-3 py-2.5 text-sm font-normal text-slate-900 shadow-2xs focus:border-[#0284c7] focus:outline-none"
            value={selectedRevisionId}
            onChange={(event) => onSelectRevisionId(event.target.value)}
          >
            <option value="">--</option>
            {certificates.map((cert) => (
              <option key={cert.revisionId} value={cert.revisionId}>
                {cert.certificateNumber} ({cert.issuedAt ?? "—"} → {cert.expiresAt ?? "—"}
                ) — {localizeDomainText(cert.productName, locale)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-[#0c4a6e] sm:col-span-3">
          <span className="mr-1.5 inline-block rounded bg-[#0284c7] px-2 py-0.5 text-[11px] font-bold text-[#fef08a] uppercase">
            {locale === "ru" ? "Шаг 2" : locale === "kk" ? "2-қадам" : "Step 2"}
          </span>
          {t("assessmentDate")}
          <input
            type="date"
            className="mt-1.5 w-full rounded-lg border border-[#93c5fd] bg-white px-3 py-2 text-sm font-normal text-slate-900 shadow-2xs focus:border-[#0284c7] focus:outline-none"
            value={assessmentDate}
            onChange={(event) => onChangeAssessmentDate(event.target.value)}
          />
        </label>
        <div className="sm:col-span-3">
          <div className="mb-1.5 text-xs font-bold text-[#0c4a6e]">
            <span className="mr-1.5 inline-block rounded bg-[#0284c7] px-2 py-0.5 text-[11px] font-bold text-[#fef08a] uppercase">
              {locale === "ru" ? "Шаг 3" : locale === "kk" ? "3-қадам" : "Step 3"}
            </span>
            {locale === "ru"
              ? "Запустите расчёт:"
              : locale === "kk"
                ? "Есептеуді іске қосыңыз:"
                : "Run check:"}
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-gradient-to-r from-[#0284c7] to-[#0097b2] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:from-[#0369a1] hover:to-[#0284c7] disabled:opacity-50"
            disabled={runningAssessment || !selectedRevisionId || !assessmentDate}
            onClick={onRunAssessment}
          >
            {runningAssessment ? t("runningAssessment") : t("runAssessmentButton")}
          </button>
        </div>
      </div>

      {assessmentMessage && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900">
          {assessmentMessage}
        </p>
      )}

      {assessmentState === "ready" && displayedAssessments.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-600">{t("noAssessments")}</p>
        </div>
      )}

      {assessmentState === "ready" &&
        displayedAssessments.map((assessment) => {
          const matchedCategory = categories.find(
            (c) => c.code === assessment.productCategoryCode,
          );
          const localizedCategoryLabel = matchedCategory
            ? (getLocalizedName(matchedCategory.translations, locale) ??
              matchedCategory.code)
            : assessment.productCategoryCode;
          const matchedCert = certificates.find(
            (c) => c.revisionId === assessment.certificateRevisionId,
          );

          return (
            <article
              key={assessment.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5"
            >
              {/* Certificate Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-extrabold tracking-wide text-blue-600 uppercase">
                    {assessment.certificateNumber} • {t("assessmentDate")}:{" "}
                    {assessment.assessmentDate}
                  </p>
                  <h3 className="mt-0.5 text-lg font-bold text-slate-900">
                    {localizeDomainText(assessment.productName, locale)}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    <span className="font-semibold">{localizedCategoryLabel}</span>
                    {matchedCert ? (
                      <>
                        {" "}
                        · {t("manufacturer")}:{" "}
                        <strong>
                          {localizeDomainText(matchedCert.manufacturer, locale)}
                        </strong>{" "}
                        · {t("certificateValidityLabel")}: {matchedCert.issuedAt ?? "—"} →{" "}
                        {matchedCert.expiresAt ?? "—"}
                      </>
                    ) : null}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                    assessment.overallStatus === "ready"
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-rose-100 text-rose-900"
                  }`}
                >
                  {t(`overall_${assessment.overallStatus}`)}
                </span>
              </div>

              {/* 4-Card Summary */}
              <div className="mt-4">
                <p className="mb-2.5 text-xs font-extrabold tracking-wide text-slate-600 uppercase">
                  {t("actionSummaryTitle")}
                </p>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                    <span className="text-2xl font-extrabold text-emerald-900">
                      {assessment.summaryCounts.required ?? 0}
                    </span>
                    <p className="mt-0.5 text-xs font-bold text-emerald-900">
                      {t("summaryCreditedCard")}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-emerald-800">
                      {t("summaryCreditedHint")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5">
                    <span className="text-2xl font-extrabold text-amber-900">
                      {assessment.summaryCounts.changed ?? 0}
                    </span>
                    <p className="mt-0.5 text-xs font-bold text-amber-900">
                      {t("summaryRetestCard")}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-amber-800">
                      {t("summaryRetestHint")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5">
                    <span className="text-2xl font-extrabold text-blue-900">
                      {assessment.summaryCounts.additional ?? 0}
                    </span>
                    <p className="mt-0.5 text-xs font-bold text-blue-900">
                      {t("summaryNewTestCard")}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-blue-800">
                      {t("summaryNewTestHint")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="text-2xl font-extrabold text-slate-800">
                      {(assessment.summaryCounts.review ?? 0) +
                        (assessment.summaryCounts.historical_only ?? 0)}
                    </span>
                    <p className="mt-0.5 text-xs font-bold text-slate-800">
                      {t("summaryReviewCard")}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                      {t("summaryReviewHint")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Test-by-Test Comparison */}
              <div className="mt-5 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                {assessment.results.map((item) => {
                  const evidenceKey = `${assessment.id}:${item.key}`;
                  const isExpanded = Boolean(expandedEvidenceKeys[evidenceKey]);
                  const historicalMatch = matchedCert?.tests.find(
                    (ht) => ht.testCode === item.testCode,
                  );
                  const matchedDataset = datasets.find(
                    (ds) => ds.id === assessment.regulatoryDatasetId,
                  );
                  const currentReqMatch = matchedDataset?.requirements.find(
                    (r) =>
                      r.testCode === item.testCode &&
                      r.productCategoryCode === assessment.productCategoryCode,
                  );

                  return (
                    <div key={item.key} className="p-4 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-bold ${resultStateStyles[item.state]}`}
                          >
                            {t(`state_${item.state}`)}
                          </span>
                          <strong className="text-slate-900">
                            {localizeDomainText(item.testName, locale)}
                          </strong>
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

                      <p className="mt-2 leading-relaxed text-slate-700">
                        {localizeAssessmentReason(item.state, item.reason, locale)}
                      </p>

                      {/* Side-by-Side Comparison: Previous Certificate vs This Year */}
                      <div className="mt-3 grid gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-2">
                        <div className="rounded border border-slate-200/80 bg-white p-2.5">
                          <p className="mb-1 font-bold text-slate-500 uppercase">
                            {t("previousCertValueLabel")}
                          </p>
                          {historicalMatch ? (
                            <p className="text-slate-900">
                              <span className="font-semibold">
                                {historicalMatch.standardCode ?? ""}{" "}
                                {localizeDomainText(
                                  historicalMatch.standardClause,
                                  locale,
                                )}
                              </span>
                              {" — "}
                              <strong>
                                {formatParametersLocalized(
                                  historicalMatch.parameters,
                                  locale,
                                )}
                              </strong>
                              {historicalMatch.protocolNumber ? (
                                <span className="mt-0.5 block text-slate-500">
                                  {t("protocolLabel")} {historicalMatch.protocolNumber}
                                </span>
                              ) : null}
                            </p>
                          ) : (
                            <p className="font-semibold text-rose-700">—</p>
                          )}
                        </div>
                        <div className="rounded border border-blue-100 bg-blue-50/40 p-2.5">
                          <p className="mb-1 font-bold text-blue-800 uppercase">
                            {t("currentYearNormLabel")}
                          </p>
                          {currentReqMatch ? (
                            <p className="text-slate-900">
                              <span className="font-semibold">
                                {currentReqMatch.standardCode}{" "}
                                {localizeDomainText(
                                  currentReqMatch.standardClause,
                                  locale,
                                )}
                              </span>
                              {" — "}
                              <strong>
                                {formatParametersLocalized(
                                  currentReqMatch.parameters,
                                  locale,
                                )}
                              </strong>
                            </p>
                          ) : item.provenance ? (
                            <p className="text-slate-900">
                              {item.provenance.standardCode}{" "}
                              {localizeDomainText(item.provenance.standardClause, locale)}
                            </p>
                          ) : (
                            <p className="text-slate-500">—</p>
                          )}
                        </div>
                      </div>

                      {isExpanded && item.provenance && (
                        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-700">
                          <p className="font-bold text-slate-900">
                            {localizedCategoryLabel} → {item.provenance.regulationCode} (
                            {item.provenance.regulationVersionLabel}) →{" "}
                            {localizeDomainText(item.provenance.provision, locale)} →{" "}
                            {item.provenance.standardCode} (
                            {item.provenance.standardVersionLabel}) →{" "}
                            {localizeDomainText(item.provenance.standardClause, locale)}
                          </p>
                          <p className="mt-1">
                            {t("sourceCitationLabel")}{" "}
                            <strong>
                              {localizeDomainText(
                                item.provenance.sourceReference,
                                locale,
                              )}
                            </strong>{" "}
                            —{" "}
                            {localizeDomainText(
                              item.provenance.sourcePageSection,
                              locale,
                            )}{" "}
                            ({t(`reviewStatus_${item.provenance.reviewStatus}`)})
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
    </section>
  );
}
