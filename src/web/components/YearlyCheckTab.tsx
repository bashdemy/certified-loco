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
import { KazcszhtReportModal } from "./KazcszhtReportModal";

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
  const [reportAssessment, setReportAssessment] = useState<AssessmentRecord | null>(null);
  const [certSearch, setCertSearch] = useState("");
  const [issueYearFilter, setIssueYearFilter] = useState<string>("");

  const L = (ru: string, en: string, kk: string) =>
    locale === "ru" ? ru : locale === "kk" ? kk : en;

  const issueYears = Array.from(
    new Set(
      certificates
        .map((c) => c.issuedAt?.slice(0, 4))
        .filter((y): y is string => Boolean(y)),
    ),
  ).sort((a, b) => b.localeCompare(a));

  const searchLower = certSearch.trim().toLowerCase();
  const visibleCertificates = certificates.filter((c) => {
    if (issueYearFilter && c.issuedAt?.slice(0, 4) !== issueYearFilter) return false;
    if (!searchLower) return true;
    const categoryName =
      getLocalizedName(
        categories.find((cat) => cat.code === c.productCategoryCode)?.translations ?? [],
        locale,
      ) ?? "";
    return [
      c.certificateNumber,
      c.productName,
      localizeDomainText(c.productName, locale),
      c.productModel ?? "",
      c.manufacturer,
      localizeDomainText(c.manufacturer, locale),
      categoryName,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchLower);
  });

  const selectedCert = certificates.find((c) => c.revisionId === selectedRevisionId);
  const targetYear = assessmentDate.slice(0, 4);
  const currentYear = new Date().getFullYear();
  const targetYearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const setTargetYear = (year: number) => {
    const monthDay = assessmentDate.length === 10 ? assessmentDate.slice(5) : "06-01";
    onChangeAssessmentDate(`${year}-${monthDay}`);
  };

  const stepBadge = (n: number) => (
    <span className="mr-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#0284c7] px-2 text-[11px] font-bold text-[#fef08a] uppercase">
      {L(`Шаг ${n}`, `Step ${n}`, `${n}-қадам`)}
    </span>
  );

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

      {/* STEP 1 — full-width searchable certificate picker with previous-year filter */}
      <div className="mb-4 rounded-xl border border-[#bae6fd] bg-gradient-to-r from-[#f0f9ff] via-[#f5fbff] to-[#fffdf5] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center text-base font-bold text-[#0c4a6e]">
            {stepBadge(1)}
            {L(
              "Выберите год и сертификат прошлого периода",
              "Choose the previous year and certificate",
              "Алдыңғы жылды және сертификатты таңдаңыз",
            )}
          </h3>
          <span className="text-xs text-slate-500">
            {L("Найдено", "Found", "Табылды")}: {visibleCertificates.length} /{" "}
            {certificates.length}
          </span>
        </div>

        {/* Previous year chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">
            {L("Год выдачи сертификата:", "Certificate issue year:", "Берілген жылы:")}
          </span>
          {["", ...issueYears].map((year) => (
            <button
              key={year || "all"}
              type="button"
              onClick={() => setIssueYearFilter(year)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                issueYearFilter === year
                  ? "bg-[#0284c7] text-white shadow-xs"
                  : "border border-[#bae6fd] bg-white text-[#0c4a6e] hover:bg-[#e0f2fe]"
              }`}
            >
              {year || L("Все годы", "All years", "Барлық жылдар")}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="search"
          value={certSearch}
          onChange={(e) => setCertSearch(e.target.value)}
          placeholder={L(
            "🔍 Поиск: номер сертификата, продукция, модель, изготовитель…",
            "🔍 Search: certificate number, product, model, manufacturer…",
            "🔍 Іздеу: сертификат нөмірі, өнім, модель, дайындаушы…",
          )}
          className="mt-3 w-full rounded-lg border border-[#93c5fd] bg-white px-4 py-3 text-base text-slate-900 shadow-2xs focus:border-[#0284c7] focus:outline-none"
        />

        {/* Full-width selectable certificate list */}
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
          {visibleCertificates.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
              {L(
                "Ничего не найдено. Измените год или запрос.",
                "Nothing found. Change the year or search.",
                "Ештеңе табылмады.",
              )}
            </p>
          )}
          {visibleCertificates.map((cert) => {
            const isSelected = cert.revisionId === selectedRevisionId;
            const categoryName =
              getLocalizedName(
                categories.find((cat) => cat.code === cert.productCategoryCode)
                  ?.translations ?? [],
                locale,
              ) ?? cert.productCategoryCode;
            return (
              <button
                key={cert.revisionId}
                type="button"
                onClick={() => onSelectRevisionId(cert.revisionId)}
                className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition ${
                  isSelected
                    ? "border-[#0284c7] bg-[#e0f2fe] ring-2 ring-[#0284c7]/40"
                    : "border-slate-200 bg-white hover:border-[#93c5fd] hover:bg-[#f8fcff]"
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected ? "border-[#0284c7] bg-[#0284c7]" : "border-slate-300"
                    }`}
                  >
                    {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-bold text-[#0369a1]">
                      {cert.certificateNumber}
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {localizeDomainText(cert.productName, locale)}
                    </div>
                    <div className="text-xs text-slate-600">
                      {categoryName} · {localizeDomainText(cert.manufacturer, locale)}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-900">
                    {L("Выдан", "Issued", "Берілді")} {cert.issuedAt?.slice(0, 4) ?? "—"}
                  </span>
                  <span className="text-slate-500">
                    {cert.issuedAt ?? "—"} → {cert.expiresAt ?? "—"} · {cert.tests.length}{" "}
                    {L("исп.", "tests", "сынақ")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2 + STEP 3 */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#bae6fd] bg-[#f8fcff] p-4">
          <h3 className="flex items-center text-base font-bold text-[#0c4a6e]">
            {stepBadge(2)}
            {L("Год, на который проверяем", "Year to check against", "Тексеру жылы")}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {targetYearOptions.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setTargetYear(year)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  targetYear === String(year)
                    ? "bg-[#fbbf24] text-[#083344] shadow-xs ring-2 ring-[#fef08a]"
                    : "border border-[#bae6fd] bg-white text-[#0c4a6e] hover:bg-[#e0f2fe]"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-xs font-semibold text-slate-600">
            {t("assessmentDate")}
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-[#93c5fd] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0284c7] focus:outline-none"
              value={assessmentDate}
              onChange={(event) => onChangeAssessmentDate(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-[#bae6fd] bg-[#f8fcff] p-4">
          <h3 className="flex items-center text-base font-bold text-[#0c4a6e]">
            {stepBadge(3)}
            {L("Запустите проверку", "Run the check", "Тексеруді іске қосыңыз")}
          </h3>
          <p className="mt-2 text-sm text-slate-700">
            {selectedCert ? (
              <>
                {L("Сравниваем", "Comparing", "Салыстыру")}{" "}
                <strong>
                  {L("сертификат", "certificate", "сертификат")}{" "}
                  {selectedCert.issuedAt?.slice(0, 4) ?? "—"}
                </strong>{" "}
                →{" "}
                <strong>
                  {L("нормы", "norms", "нормалар")} {targetYear}
                </strong>
                <span className="block truncate text-xs text-slate-500">
                  {selectedCert.certificateNumber} —{" "}
                  {localizeDomainText(selectedCert.productName, locale)}
                </span>
              </>
            ) : (
              <span className="text-slate-500">
                {L(
                  "Сначала выберите сертификат в шаге 1.",
                  "Select a certificate in step 1 first.",
                  "Алдымен 1-қадамда сертификат таңдаңыз.",
                )}
              </span>
            )}
          </p>
          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-gradient-to-r from-[#0284c7] to-[#0097b2] px-4 py-3 text-base font-bold text-white shadow-xs transition hover:from-[#0369a1] hover:to-[#0284c7] disabled:opacity-50"
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
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReportAssessment(assessment)}
                    className="rounded-lg border border-[#0284c7] bg-white px-3 py-1.5 text-xs font-bold text-[#0c4a6e] shadow-2xs transition hover:bg-[#e0f2fe]"
                  >
                    {locale === "ru"
                      ? "📄 Заключение ОПС КазЦСЖТ и направление в ИЦ (Печать / PDF)"
                      : locale === "kk"
                        ? "📄 ҚазТЖСО қорытындысы және СЗ жолдамасы (Басып шығару / PDF)"
                        : "📄 KazCSZhT Conclusion & Testing Center Direction (Print / PDF)"}
                  </button>
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

      {reportAssessment && (
        <KazcszhtReportModal
          locale={locale}
          assessment={reportAssessment}
          certificate={certificates.find(
            (c) => c.revisionId === reportAssessment.certificateRevisionId,
          )}
          dataset={datasets.find((ds) => ds.id === reportAssessment.regulatoryDatasetId)}
          categoryLabel={
            getLocalizedName(
              categories.find((c) => c.code === reportAssessment.productCategoryCode)
                ?.translations ?? [],
              locale,
            ) ?? reportAssessment.productCategoryCode
          }
          onClose={() => setReportAssessment(null)}
        />
      )}
    </section>
  );
}
