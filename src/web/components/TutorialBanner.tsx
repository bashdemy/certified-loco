import type { Locale } from "../../i18n/config";
import type { ActiveTab } from "../types";

type Props = {
  activeTab: ActiveTab;
  locale: Locale;
  isDad?: boolean;
  onDismiss: () => void;
  onSwitchTab: (tab: ActiveTab) => void;
};

export function TutorialBanner({
  activeTab,
  locale,
  isDad,
  onDismiss,
  onSwitchTab,
}: Props) {
  const isRu = locale === "ru" || isDad;

  if (activeTab === "check") {
    return (
      <section className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-5 text-slate-900 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-base font-bold text-white">
              💡
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isRu
                  ? "Памятка: Как проверить сертификат прошлого года на этот год (Вкладка 1)"
                  : "Quick Guide: How to check a past certificate for this year (Tab 1)"}
              </h2>
              <p className="text-xs text-slate-700">
                {isRu
                  ? "Эта страница показывает, какие испытания из старого сертификата ещё действуют, а какие нужно досдать в лаборатории в этом году."
                  : "This page shows which tests from an existing certificate still apply and which ones must be re-tested in a laboratory this year."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-amber-100"
          >
            {isRu ? "Скрыть подсказку ✕" : "Hide tips ✕"}
          </button>
        </div>

        {/* 3 Clear Steps */}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-amber-200 bg-white p-3.5">
            <div className="text-xs font-bold tracking-wide text-amber-800 uppercase">
              {isRu ? "Шаг 1 · Выберите сертификат" : "Step 1 · Select certificate"}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">
              {isRu
                ? "В выпадающем списке «Выберите прошлый сертификат для проверки» выберите нужный сертификат (например, колесную пару КП-2М или РУ1Ш-957-Г)."
                : "Choose the certificate you want to inspect in the dropdown menu below."}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-white p-3.5">
            <div className="text-xs font-bold tracking-wide text-amber-800 uppercase">
              {isRu ? "Шаг 2 · Нажмите синюю кнопку" : "Step 2 · Click the blue button"}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">
              {isRu
                ? "Нажмите кнопку «Определить, что нужно сертифицировать в этом году». Система автоматически сравнит старые протоколы с действующими нормами ГОСТ и ТР ТС 001/2011."
                : "Click 'Determine what must be certified this year' to compare past protocols against current ГОСТ & ТР ТС 001/2011 norms."}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-white p-3.5">
            <div className="text-xs font-bold tracking-wide text-amber-800 uppercase">
              {isRu ? "Шаг 3 · Посмотрите результат" : "Step 3 · Read the result"}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">
              {isRu
                ? "В карточках ниже слева показано «Было в прошлом сертификате», а справа — «Требуется в этом году»."
                : "Each row compares 'In previous certificate' (left) with 'Required this year' (right)."}
            </p>
          </div>
        </div>

        {/* Color Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200/80 bg-white/90 px-3.5 py-2.5 text-xs">
          <span className="font-semibold text-slate-800">
            {isRu ? "Что означают цвета:" : "Color legend:"}
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 font-medium text-emerald-900">
            {isRu
              ? "🟢 Зачтено — пересдавать НЕ нужно"
              : "🟢 Credited — no re-test needed"}
          </span>
          <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 font-medium text-amber-900">
            {isRu
              ? "🟡 Норма изменилась — нужно переиспытание в ИЛ"
              : "🟡 Norm changed — re-test required"}
          </span>
          <span className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 font-medium text-blue-900">
            {isRu
              ? "🔵 Новое требование — не было в старом сертификате, нужно испытать"
              : "🔵 New requirement — lab test needed"}
          </span>
        </div>
      </section>
    );
  }

  if (activeTab === "certificates") {
    return (
      <section className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-5 text-slate-900 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-base font-bold text-white">
              💡
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isRu
                  ? "Памятка: Как работать со старыми сертификатами и протоколами (Вкладка 2)"
                  : "Quick Guide: Working with past certificates & protocols (Tab 2)"}
              </h2>
              <p className="text-xs text-slate-700">
                {isRu
                  ? "Здесь хранятся сертификаты прошлых лет и результаты их лабораторных испытаний (протоколы ИЛ)."
                  : "Manage certificates from previous years and their laboratory test protocols."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-amber-100"
          >
            {isRu ? "Скрыть подсказку ✕" : "Hide tips ✕"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-amber-200 bg-white p-3.5">
            <div className="text-xs font-bold tracking-wide text-amber-800 uppercase">
              {isRu ? "1 · Добавить новый сертификат" : "1 · Add a certificate"}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">
              {isRu
                ? "Нажмите тёмную кнопку «Добавить сертификат» справа, введите номер сертификата ЕАЭС KZ, продукцию и изготовителя, затем нажмите «Создать»."
                : "Click 'Add certificate', fill in the EAEU KZ number and manufacturer, and click 'Create'."}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-white p-3.5">
            <div className="text-xs font-bold tracking-wide text-amber-800 uppercase">
              {isRu
                ? "2 · Внести испытание из протокола"
                : "2 · Add a test from a protocol"}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">
              {isRu
                ? "Внутри карточки сертификата нажмите «+ Добавить испытание из протокола», выберите испытание, стандарт ГОСТ, укажите пункт (например, п. 5.2.4) и значения из протокола."
                : "Inside a certificate card, click '+ Add test from protocol', pick the test and ГОСТ standard, and enter the measured parameters."}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-white p-3.5">
            <div className="text-xs font-bold tracking-wide text-amber-800 uppercase">
              {isRu
                ? "3 · Перейти к проверке на этот год"
                : "3 · Jump to this year's check"}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">
              {isRu
                ? "Нажмите синюю кнопку «Проверить требования на этот год →» на карточке сертификата, чтобы сразу перейти на Вкладку 1 и увидеть расчёт."
                : "Click 'Check requirements for this year →' on any certificate to jump straight to Tab 1."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-5 text-slate-900 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-base font-bold text-white">
            💡
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isRu
                ? "Памятка: Нормативная база ТР ТС 001/2011 и ГОСТ (Вкладка 3)"
                : "Quick Guide: ТР ТС 001/2011 & ГОСТ Standards Base (Tab 3)"}
            </h2>
            <p className="text-xs text-slate-700">
              {isRu
                ? "Справочник действующих норм ГОСТ и ТР ТС 001/2011, по которым система проверяет сертификаты на Вкладке 1."
                : "Reference directory of active ГОСТ and ТР ТС 001/2011 requirements used during certificate checks."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSwitchTab("check")}
            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
          >
            {isRu ? "← Вернуться к проверке сертификата" : "← Back to check"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-amber-100"
          >
            {isRu ? "Скрыть подсказку ✕" : "Hide tips ✕"}
          </button>
        </div>
      </div>
    </section>
  );
}
