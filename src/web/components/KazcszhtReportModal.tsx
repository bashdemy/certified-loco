import {
  formatParametersLocalized,
  localizeAssessmentReason,
  localizeDomainText,
  type Locale,
} from "../../i18n/config";
import type { AssessmentRecord, Certificate, RegulatoryDataset } from "../types";

type Props = {
  locale: Locale;
  assessment: AssessmentRecord;
  certificate: Certificate | undefined;
  dataset: RegulatoryDataset | undefined;
  categoryLabel: string;
  onClose: () => void;
};

export function KazcszhtReportModal({
  locale,
  assessment,
  certificate,
  dataset,
  categoryLabel,
  onClose,
}: Props) {
  const isRu = locale === "ru" || locale === "kk";
  const creditedItems = assessment.results.filter((r) => r.state === "required");
  const labRequiredItems = assessment.results.filter(
    (r) => r.state === "changed" || r.state === "additional",
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 print:static print:bg-white print:p-0">
      <div className="my-8 w-full max-w-4xl rounded-2xl border border-[#bae6fd] bg-white p-6 text-slate-900 shadow-2xl sm:p-8 print:my-0 print:max-w-none print:rounded-none print:border-none print:shadow-none">
        {/* Action Bar (hidden when printing) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-[#0284c7] px-2.5 py-1 text-xs font-bold text-[#fef08a]">
              КазЦСЖТ · ОПС / ИЦ
            </span>
            <span className="text-sm font-semibold text-[#0c4a6e]">
              {isRu
                ? "Официальная форма: Заключение эксперта ОПС и Направление в ИЦ КазЦСЖТ"
                : "Official Form: KazCSZhT Expert Conclusion & Testing Center Direction"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-[#0284c7] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0369a1]"
            >
              {isRu ? "🖨 Распечатать / Сохранить в PDF" : "🖨 Print / Save as PDF"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              {isRu ? "Закрыть ✕" : "Close ✕"}
            </button>
          </div>
        </div>

        {/* Official KazCSZhT Document Header */}
        <div className="border-b-2 border-[#0c4a6e] pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-wider text-[#0284c7] uppercase">
                {isRu
                  ? "Республика Казахстан · Единый реестр ОПС и ИЛ ЕАЭС"
                  : "Republic of Kazakhstan · EAEU Unified Register of CABs"}
              </p>
              <h1 className="mt-1 text-lg font-extrabold text-[#0c4a6e] sm:text-xl">
                {isRu
                  ? "ТОО «Казахстанский центр сертификации на железнодорожном транспорте» (КазЦСЖТ)"
                  : "LLP 'Kazakhstan Center for Certification on Railway Transport' (KazCSZhT)"}
              </h1>
              <p className="mt-1 text-xs text-slate-600">
                {isRu
                  ? "ОПС: г. Астана, пр. Туран, 30А (kazcszht.kz) · Испытательный центр (ИЦ КазЦСЖТ, ГОСТ ISO/IEC 17025): г. Экибастуз, пр. им. Д.А. Кунаева, 203"
                  : "CAB: Astana, Turan Ave 30A (kazcszht.kz) · Testing Center (ISO/IEC 17025): Ekibastuz, Kunaev Ave 203"}
              </p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <div className="font-bold text-slate-900">
                {isRu
                  ? `АКТ АНАЛИЗА И НАПРАВЛЕНИЕ В ИЦ № ${assessment.id.slice(0, 8).toUpperCase()}`
                  : `ASSESSMENT ACT & LAB DIRECTION #${assessment.id.slice(0, 8).toUpperCase()}`}
              </div>
              <div>
                {isRu ? "Дата оценки:" : "Assessment date:"}{" "}
                <strong>{assessment.assessmentDate}</strong>
              </div>
              <div>
                {isRu ? "Набор норм:" : "Dataset:"}{" "}
                <span className="font-mono">{assessment.regulatoryDatasetCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Metadata Table */}
        <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-2">
          <div>
            <span className="text-slate-500">
              {isRu ? "Проверяемый сертификат:" : "Certificate number:"}
            </span>{" "}
            <strong className="text-slate-900">
              {assessment.certificateNumber} (рев. {assessment.revisionNumber})
            </strong>
          </div>
          <div>
            <span className="text-slate-500">
              {isRu ? "Срок действия и схема:" : "Validity & scheme:"}
            </span>{" "}
            <strong className="text-slate-900">
              {certificate?.issuedAt ?? "—"} → {certificate?.expiresAt ?? "—"} (
              {isRu ? "схема" : "scheme"} {certificate?.certificationScheme ?? "3с"},{" "}
              {certificate?.regulationCode ?? "ТР ТС 001/2011"})
            </strong>
          </div>
          <div>
            <span className="text-slate-500">
              {isRu ? "Наименование продукции:" : "Product:"}
            </span>{" "}
            <strong className="text-slate-900">
              {localizeDomainText(assessment.productName, locale)} ({categoryLabel})
            </strong>
          </div>
          <div>
            <span className="text-slate-500">
              {isRu ? "Изготовитель / Заявитель:" : "Manufacturer / Applicant:"}
            </span>{" "}
            <strong className="text-slate-900">
              {localizeDomainText(certificate?.manufacturer ?? "—", locale)} /{" "}
              {localizeDomainText(certificate?.applicant ?? "—", locale)}
            </strong>
          </div>
        </div>

        {/* Section 1: Credited Protocols */}
        <div className="mt-6">
          <h2 className="text-sm font-bold text-emerald-900">
            {isRu
              ? `1. Протоколы предыдущего сертификата, ЗАЧИТЫВАЕМЫЕ в текущем году (${creditedItems.length} поз.) — переиспытание НЕ требуется`
              : `1. Previous Certificate Protocols CREDITED This Year (${creditedItems.length}) — No Re-testing Required`}
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            {isRu
              ? "Основание: ст. 32 Закона РК № 396-VI «О техническом регулировании», Приказ МТИ РК № 433-НҚ «Правила оценки соответствия» (нормативные значения ГОСТ не изменились)."
              : "Basis: Law of RK No. 396-VI & Conformity Assessment Rules No. 433-NK (ГОСТ clause and limit values unchanged)."}
          </p>

          {creditedItems.length === 0 ? (
            <p className="mt-2 rounded-lg border border-slate-200 p-3 text-xs text-slate-500">
              {isRu ? "Нет автоматически зачтённых испытаний." : "No credited tests."}
            </p>
          ) : (
            <table className="mt-2 w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-emerald-50 text-left text-emerald-950">
                  <th className="border border-slate-300 p-2">
                    {isRu ? "Наименование испытания" : "Test"}
                  </th>
                  <th className="border border-slate-300 p-2">
                    {isRu ? "Стандарт ГОСТ и пункт" : "ГОСТ & Clause"}
                  </th>
                  <th className="border border-slate-300 p-2">
                    {isRu ? "Протокол прошлого сертификата" : "Past Protocol"}
                  </th>
                  <th className="border border-slate-300 p-2">
                    {isRu ? "Нормативные показатели" : "Parameters"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {creditedItems.map((item, idx) => {
                  const historicalMatch = certificate?.tests.find(
                    (ht) => ht.testCode === item.testCode,
                  );
                  const currentReqMatch = dataset?.requirements.find(
                    (r) =>
                      r.testCode === item.testCode &&
                      r.productCategoryCode === assessment.productCategoryCode,
                  );
                  return (
                    <tr key={`${item.testCode}-${idx}`}>
                      <td className="border border-slate-300 p-2 font-semibold">
                        {localizeDomainText(item.testName, locale)}
                      </td>
                      <td className="border border-slate-300 p-2">
                        {localizeDomainText(
                          currentReqMatch?.standardCode ??
                            item.provenance?.standardCode ??
                            historicalMatch?.standardCode ??
                            "—",
                          locale,
                        )}{" "}
                        {localizeDomainText(
                          currentReqMatch?.standardClause ??
                            item.provenance?.standardClause ??
                            historicalMatch?.standardClause ??
                            "",
                          locale,
                        )}
                      </td>
                      <td className="border border-slate-300 p-2 font-mono">
                        {historicalMatch?.protocolNumber ?? "—"}
                      </td>
                      <td className="border border-slate-300 p-2">
                        {formatParametersLocalized(
                          currentReqMatch?.parameters ?? historicalMatch?.parameters,
                          locale,
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 2: Direction to KazCSZhT Testing Center (Ekibastuz) */}
        <div className="mt-6">
          <h2 className="text-sm font-bold text-amber-900">
            {isRu
              ? `2. ПРОГРАММА ОБЯЗАТЕЛЬНЫХ ДОИСПЫТАНИЙ / ПЕРЕИСПЫТАНИЙ в ИЦ КазЦСЖТ (г. Экибастуз) на этот год (${labRequiredItems.length} поз.)`
              : `2. MANDATORY RE-TESTING & ADDITIONAL TESTS at KazCSZhT Testing Center (${labRequiredItems.length})`}
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            {isRu
              ? "Перечень показателей, по которым изменились нормы ГОСТ либо которые отсутствовали в прошлом сертификате и подлежат проведению в аккредитованной ИЛ."
              : "Tests where ГОСТ parameters changed since the previous certificate or that are newly required this year."}
          </p>

          {labRequiredItems.length === 0 ? (
            <div className="mt-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">
              {isRu
                ? "✓ Все обязательные испытания по действующему набору норм ТР ТС зачтены. Проведение дополнительных лабораторных испытаний в этом году не требуется."
                : "✓ All mandatory tests are credited. No additional laboratory tests required this year."}
            </div>
          ) : (
            <table className="mt-2 w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-amber-50 text-left text-amber-950">
                  <th className="border border-slate-300 p-2">
                    {isRu ? "Вид работ" : "Action"}
                  </th>
                  <th className="border border-slate-300 p-2">
                    {isRu ? "Испытание и ГОСТ" : "Test & ГОСТ"}
                  </th>
                  <th className="border border-slate-300 p-2">
                    {isRu ? "Было в прошлом сертификате" : "Previous Certificate"}
                  </th>
                  <th className="border border-slate-300 p-2">
                    {isRu ? "Требуемая норма в этом году" : "Required This Year"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {labRequiredItems.map((item, idx) => {
                  const historicalMatch = certificate?.tests.find(
                    (ht) => ht.testCode === item.testCode,
                  );
                  const currentReqMatch = dataset?.requirements.find(
                    (r) =>
                      r.testCode === item.testCode &&
                      r.productCategoryCode === assessment.productCategoryCode,
                  );
                  return (
                    <tr key={`${item.testCode}-${idx}`}>
                      <td className="border border-slate-300 p-2 font-bold">
                        {item.state === "changed"
                          ? isRu
                            ? "ПЕРЕИСПЫТАНИЕ (изменилась норма)"
                            : "RE-TEST (norm changed)"
                          : isRu
                            ? "ДОИСПЫТАНИЕ (новое требование)"
                            : "NEW TEST (absent previously)"}
                      </td>
                      <td className="border border-slate-300 p-2">
                        <div className="font-semibold">
                          {localizeDomainText(item.testName, locale)}
                        </div>
                        <div className="text-slate-600">
                          {localizeDomainText(
                            currentReqMatch?.standardCode ??
                              item.provenance?.standardCode ??
                              historicalMatch?.standardCode ??
                              "—",
                            locale,
                          )}{" "}
                          {localizeDomainText(
                            currentReqMatch?.standardClause ??
                              item.provenance?.standardClause ??
                              historicalMatch?.standardClause ??
                              "",
                            locale,
                          )}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2 text-slate-600">
                        {historicalMatch
                          ? formatParametersLocalized(historicalMatch.parameters, locale)
                          : isRu
                            ? "Отсутствовало в прошлом сертификате"
                            : "Not present in past certificate"}
                      </td>
                      <td className="border border-slate-300 p-2 font-semibold text-slate-900">
                        {currentReqMatch
                          ? formatParametersLocalized(currentReqMatch.parameters, locale)
                          : "—"}
                        <div className="mt-1 text-[11px] font-normal text-slate-600">
                          {localizeAssessmentReason(item.state, item.reason, locale)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Signatures Block */}
        <div className="mt-8 grid gap-6 border-t border-slate-300 pt-6 text-xs sm:grid-cols-3">
          <div>
            <div className="font-semibold text-slate-800">
              {isRu ? "Эксперт-аудитор ОПС ТОО «КазЦСЖТ»" : "Lead Auditor, KazCSZhT CAB"}
            </div>
            <div className="mt-6 border-b border-slate-400 pb-1 text-slate-400">
              {isRu ? "Подпись / Ф.И.О." : "Signature / Name"}
            </div>
          </div>
          <div>
            <div className="font-semibold text-slate-800">
              {isRu
                ? "Руководитель ИЦ КазЦСЖТ (г. Экибастуз)"
                : "Head of KazCSZhT Testing Center"}
            </div>
            <div className="mt-6 border-b border-slate-400 pb-1 text-slate-400">
              {isRu ? "Подпись / Ф.И.О." : "Signature / Name"}
            </div>
          </div>
          <div>
            <div className="font-semibold text-slate-800">
              {isRu
                ? "Представитель заявителя / изготовителя"
                : "Applicant / Manufacturer Representative"}
            </div>
            <div className="mt-6 border-b border-slate-400 pb-1 text-slate-400">
              {isRu ? "Подпись / Ф.И.О." : "Signature / Name"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
