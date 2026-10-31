import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getLocalizedName } from "../../domain/product-category-translations";
import {
  formatParametersLocalized,
  getParameterLabel,
  localizeDomainText,
  type Locale,
} from "../../i18n/config";
import type {
  Certificate,
  CertificateDraft,
  LoadState,
  ProductCategory,
  StandardRecord,
  TestCatalogueItem,
} from "../types";

type Props = {
  locale: Locale;
  isAdmin: boolean;
  certificates: Certificate[];
  certificateState: LoadState;
  categories: ProductCategory[];
  testsCatalogue: TestCatalogueItem[];
  standards: StandardRecord[];
  certificateDraft: CertificateDraft | null;
  creatingCertificate: boolean;
  certificateMessage: string | null;
  uploadingRevisionId: string | null;
  onStartCertificate: () => void;
  onCancelCertificate: () => void;
  onUpdateCertificateDraft: (field: keyof CertificateDraft, value: string) => void;
  onCreateCertificate: () => void;
  onConfirmRevision: (revisionId: string) => void;
  onUploadDocument: (certificate: Certificate, file: File) => void;
  onAddRevisionTest: (
    revisionId: string,
    payload: {
      testId: string;
      standardVersionId: string;
      standardClause: string;
      parameters: Record<string, unknown>;
      protocolNumber: string;
    },
  ) => Promise<void>;
  onJumpToCheck: (revisionId: string) => void;
};

export function CertificatesTab({
  locale,
  isAdmin,
  certificates,
  certificateState,
  categories,
  testsCatalogue,
  standards,
  certificateDraft,
  creatingCertificate,
  certificateMessage,
  uploadingRevisionId,
  onStartCertificate,
  onCancelCertificate,
  onUpdateCertificateDraft,
  onCreateCertificate,
  onConfirmRevision,
  onUploadDocument,
  onAddRevisionTest,
  onJumpToCheck,
}: Props) {
  const { t } = useTranslation();
  const [addingForRevisionId, setAddingForRevisionId] = useState<string | null>(null);
  const [testId, setTestId] = useState("");
  const [standardVersionId, setStandardVersionId] = useState("");
  const [standardClause, setStandardClause] = useState("");
  const [protocolNumber, setProtocolNumber] = useState("");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategoryCode, setFilterCategoryCode] = useState("");

  const standardVersionOptions = standards.flatMap((std) =>
    std.versions.map((ver) => ({
      id: ver.id,
      label: `${std.code} (${ver.versionLabel})`,
    })),
  );

  const openAddTestForm = (revisionId: string) => {
    const firstTest = testsCatalogue[0];
    setAddingForRevisionId(revisionId);
    setTestId(firstTest?.id ?? "");
    setStandardVersionId(standardVersionOptions[0]?.id ?? "");
    setStandardClause("п. 5.2.4");
    setProtocolNumber("ИЛ-2023-015");
    const initialParams: Record<string, string> = {};
    if (firstTest?.defaultParametersJson) {
      for (const [k, v] of Object.entries(firstTest.defaultParametersJson)) {
        initialParams[k] = String(v);
      }
    }
    setParamValues(initialParams);
  };

  const handleSelectTest = (nextTestId: string) => {
    setTestId(nextTestId);
    const found = testsCatalogue.find((tc) => tc.id === nextTestId);
    const nextParams: Record<string, string> = {};
    if (found?.defaultParametersJson) {
      for (const [k, v] of Object.entries(found.defaultParametersJson)) {
        nextParams[k] = String(v);
      }
    }
    setParamValues(nextParams);
  };

  const handleSaveTest = async (revisionId: string) => {
    if (!testId) return;
    const parsedParams: Record<string, unknown> = {};
    for (const [k, rawVal] of Object.entries(paramValues)) {
      const trimmed = rawVal.trim();
      const num = Number(trimmed);
      parsedParams[k] = trimmed !== "" && !Number.isNaN(num) ? num : trimmed;
    }
    await onAddRevisionTest(revisionId, {
      testId,
      standardVersionId,
      standardClause,
      parameters: parsedParams,
      protocolNumber,
    });
    setAddingForRevisionId(null);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {t("certificates")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("knowledgeCatalogueDescription")}
          </p>
        </div>
        {isAdmin && !certificateDraft && (
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
            type="button"
            onClick={onStartCertificate}
          >
            + {t("newCertificate")}
          </button>
        )}
      </div>

      {certificateDraft && (
        <div className="mb-6 grid gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 sm:grid-cols-2">
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
                onChange={(event) => onUpdateCertificateDraft(field, event.target.value)}
              />
            </label>
          ))}
          <label className="block text-sm font-semibold text-slate-700">
            {t("productCategory")}
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900"
              value={certificateDraft.productCategoryId}
              onChange={(event) =>
                onUpdateCertificateDraft("productCategoryId", event.target.value)
              }
            >
              <option value="">{t("selectCategory")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {getLocalizedName(category.translations, locale) ?? category.code}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              type="button"
              onClick={onCreateCertificate}
              disabled={creatingCertificate || !certificateDraft.productCategoryId}
            >
              {creatingCertificate ? t("creating") : t("create")}
            </button>
            <button
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"
              type="button"
              onClick={onCancelCertificate}
              disabled={creatingCertificate}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {certificateMessage && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900">
          {certificateMessage}
        </p>
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
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#bae6fd] bg-[#f8fcff] p-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                locale === "ru"
                  ? "🔍 Поиск по номеру сертификата ЕАЭС KZ, продукции или изготовителю…"
                  : locale === "kk"
                    ? "🔍 Сертификат нөмірі, өнім немесе дайындаушы бойынша іздеу…"
                    : "🔍 Search by certificate number, product, or manufacturer…"
              }
              className="min-w-[16rem] flex-1 rounded-lg border border-[#93c5fd] bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#0284c7] focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFilterCategoryCode("")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  filterCategoryCode === ""
                    ? "bg-[#0284c7] text-white"
                    : "border border-[#bae6fd] bg-white text-[#0c4a6e] hover:bg-[#e0f2fe]"
                }`}
              >
                {locale === "ru"
                  ? "Все категории"
                  : locale === "kk"
                    ? "Барлық санаттар"
                    : "All categories"}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFilterCategoryCode(cat.code)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    filterCategoryCode === cat.code
                      ? "bg-[#0284c7] text-white"
                      : "border border-[#bae6fd] bg-white text-[#0c4a6e] hover:bg-[#e0f2fe]"
                  }`}
                >
                  {getLocalizedName(cat.translations, locale) ?? cat.code}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {certificates
              .filter((c) => {
                if (filterCategoryCode && c.productCategoryCode !== filterCategoryCode) {
                  return false;
                }
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  c.certificateNumber.toLowerCase().includes(q) ||
                  c.productName.toLowerCase().includes(q) ||
                  localizeDomainText(c.productName, locale).toLowerCase().includes(q) ||
                  c.manufacturer.toLowerCase().includes(q) ||
                  localizeDomainText(c.manufacturer, locale).toLowerCase().includes(q)
                );
              })
              .map((certificate) => {
                const catObj = categories.find(
                  (c) => c.code === certificate.productCategoryCode,
                );
                const catLabel = catObj
                  ? (getLocalizedName(catObj.translations, locale) ?? catObj.code)
                  : certificate.productCategoryCode;

                return (
                  <article
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-5"
                    key={`${certificate.id}-${certificate.revisionNumber}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="mb-1 text-xs font-extrabold tracking-wide text-blue-600 uppercase">
                            {certificate.certificateNumber}
                          </p>
                          <h3 className="text-lg font-bold text-slate-900">
                            {localizeDomainText(certificate.productName, locale)}
                          </h3>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            certificate.confirmedAt
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {certificate.confirmedAt ? t("confirmed") : t("unconfirmed")}
                        </span>
                      </div>

                      <dl className="mt-3 grid gap-1.5 text-sm text-slate-600">
                        <div className="flex justify-between gap-3">
                          <dt>{t("productCategory")}</dt>
                          <dd className="text-right font-medium text-slate-900">
                            {catLabel}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt>{t("manufacturer")}</dt>
                          <dd className="text-right">
                            {localizeDomainText(certificate.manufacturer, locale)}
                          </dd>
                        </div>
                        {certificate.applicant && (
                          <div className="flex justify-between gap-3">
                            <dt>{t("applicant")}</dt>
                            <dd className="text-right">
                              {localizeDomainText(certificate.applicant, locale)}
                            </dd>
                          </div>
                        )}
                        <div className="flex justify-between gap-3">
                          <dt>{t("regulationCode")}</dt>
                          <dd className="text-right">
                            {certificate.regulationCode}
                            {certificate.certificationScheme
                              ? ` (${t("certificationSchemeShort")} ${certificate.certificationScheme})`
                              : ""}
                          </dd>
                        </div>
                        {(certificate.issuedAt || certificate.expiresAt) && (
                          <div className="flex justify-between gap-3">
                            <dt>{t("certificateValidityLabel")}</dt>
                            <dd className="text-right font-medium text-slate-800">
                              {certificate.issuedAt ?? "—"} →{" "}
                              {certificate.expiresAt ?? "—"}
                            </dd>
                          </div>
                        )}
                      </dl>

                      {/* Historical Tests List */}
                      <div className="mt-4 border-t border-slate-200 pt-3">
                        <p className="mb-2 text-xs font-bold text-slate-700 uppercase">
                          {t("historicalTests")} ({certificate.tests?.length ?? 0})
                        </p>
                        {(!certificate.tests || certificate.tests.length === 0) && (
                          <p className="text-xs text-slate-500">
                            {t("noHistoricalTests")}
                          </p>
                        )}
                        {certificate.tests && certificate.tests.length > 0 && (
                          <ul className="space-y-2 text-xs text-slate-600">
                            {certificate.tests.map((testItem) => (
                              <li
                                key={testItem.id}
                                className="rounded-lg border border-slate-200 bg-white p-2.5"
                              >
                                <strong className="block text-slate-900">
                                  {localizeDomainText(testItem.testName, locale)}
                                </strong>
                                <span className="mt-0.5 block text-slate-600">
                                  {testItem.standardCode ?? ""}{" "}
                                  {localizeDomainText(testItem.standardClause, locale)} ·{" "}
                                  <strong className="text-slate-800">
                                    {formatParametersLocalized(
                                      testItem.parameters,
                                      locale,
                                    )}
                                  </strong>
                                  {testItem.protocolNumber
                                    ? ` (${t("protocolLabel")} ${testItem.protocolNumber})`
                                    : ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Friendly Add-Test Form (No Raw JSON Needed!) */}
                      {addingForRevisionId === certificate.revisionId && (
                        <div className="mt-3 space-y-2.5 rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs">
                          <select
                            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2"
                            value={testId}
                            onChange={(e) => handleSelectTest(e.target.value)}
                          >
                            <option value="">{t("selectTestPlaceholder")}</option>
                            {testsCatalogue.map((tc) => (
                              <option key={tc.id} value={tc.id}>
                                {localizeDomainText(tc.name, locale)}
                              </option>
                            ))}
                          </select>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <select
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2"
                              value={standardVersionId}
                              onChange={(e) => setStandardVersionId(e.target.value)}
                            >
                              <option value="">{t("selectStandardPlaceholder")}</option>
                              {standardVersionOptions.map((sv) => (
                                <option key={sv.id} value={sv.id}>
                                  {sv.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder={t("standardClausePlaceholder")}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2"
                              value={standardClause}
                              onChange={(e) => setStandardClause(e.target.value)}
                            />
                          </div>
                          <input
                            type="text"
                            placeholder={t("protocolNumberPlaceholder")}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2"
                            value={protocolNumber}
                            onChange={(e) => setProtocolNumber(e.target.value)}
                          />

                          {/* Friendly Parameter Fields */}
                          {Object.keys(paramValues).length > 0 && (
                            <div className="grid gap-2 rounded-lg border border-blue-100 bg-white p-2.5 sm:grid-cols-2">
                              {Object.entries(paramValues).map(([paramKey, paramVal]) => (
                                <label
                                  key={paramKey}
                                  className="block font-semibold text-slate-700"
                                >
                                  {getParameterLabel(paramKey, locale)}
                                  <input
                                    type="text"
                                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-normal text-slate-900"
                                    value={paramVal}
                                    onChange={(e) =>
                                      setParamValues((prev) => ({
                                        ...prev,
                                        [paramKey]: e.target.value,
                                      }))
                                    }
                                  />
                                </label>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              className="rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white"
                              onClick={() => void handleSaveTest(certificate.revisionId)}
                            >
                              {t("save")}
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700"
                              onClick={() => setAddingForRevisionId(null)}
                            >
                              {t("cancel")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
                      <button
                        type="button"
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                        onClick={() => onJumpToCheck(certificate.revisionId)}
                      >
                        {t("checkThisCertButton")}
                      </button>

                      {isAdmin && (
                        <div className="flex flex-wrap gap-1.5">
                          {!certificate.confirmedAt && (
                            <button
                              type="button"
                              className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white"
                              onClick={() => onConfirmRevision(certificate.revisionId)}
                            >
                              {t("confirmRevision")}
                            </button>
                          )}
                          <button
                            type="button"
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            onClick={() => openAddTestForm(certificate.revisionId)}
                          >
                            + {t("addHistoricalTest")}
                          </button>
                          <label className="inline-flex cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
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
                                if (file) onUploadDocument(certificate, file);
                                event.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
          </div>
        </>
      )}
    </section>
  );
}
