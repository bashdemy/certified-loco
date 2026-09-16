import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      appEyebrow: "Railway certification workspace",
      appName: "Certified Loco",
      firstRelease: "First release",
      headline: "Certification assessments with evidence you can review.",
      intro:
        "Start with a confirmed certificate, compare historical tests with the published regulatory dataset, and keep the source behind every result.",
      newAssessment: "New assessment — coming next",
      assessments: "Assessments",
      assessmentsDescription:
        "Compare a part's historical programme with current requirements.",
      knowledgeCatalogue: "Knowledge catalogue",
      knowledgeCatalogueDescription:
        "Maintain parts, tests, standards, regulations and certificates.",
      reviewAndPublish: "Review and publish",
      reviewAndPublishDescription:
        "Approve regulatory changes before users can rely on them.",
      connectedData: "Connected data",
      productCategories: "Product categories",
      records: "records",
      loadingCatalogue: "Loading catalogue…",
      catalogueUnavailable: "Catalogue unavailable. Check the database connection.",
      noCategories: "No product categories have been seeded yet.",
      checkingApi: "Checking API",
      apiConnected: "API connected",
      apiUnavailable: "API unavailable",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      saving: "Saving…",
      englishName: "English name",
      russianName: "Russian name",
      kazakhName: "Kazakh name",
      description: "Description",
      versionConflict: "This record changed elsewhere. The latest version is shown.",
      saveFailed: "Could not save this record.",
    },
  },
  ru: {
    translation: {
      appEyebrow: "Рабочее пространство сертификации железнодорожной продукции",
      appName: "Certified Loco",
      firstRelease: "Первая версия",
      headline: "Оценка сертификации с проверяемыми источниками.",
      intro:
        "Начните с подтверждённого сертификата, сравните историческую программу испытаний с опубликованными требованиями и откройте источник каждого результата.",
      newAssessment: "Новая оценка — скоро",
      assessments: "Оценки",
      assessmentsDescription:
        "Сравнение исторической программы детали с действующими требованиями.",
      knowledgeCatalogue: "Каталог знаний",
      knowledgeCatalogueDescription:
        "Детали, испытания, стандарты, нормативы и сертификаты.",
      reviewAndPublish: "Проверка и публикация",
      reviewAndPublishDescription:
        "Утверждение изменений требований до их использования.",
      connectedData: "Подключённые данные",
      productCategories: "Категории продукции",
      records: "записей",
      loadingCatalogue: "Загрузка каталога…",
      catalogueUnavailable: "Каталог недоступен. Проверьте подключение к базе данных.",
      noCategories: "Категории продукции ещё не добавлены.",
      checkingApi: "Проверка API",
      apiConnected: "API подключён",
      apiUnavailable: "API недоступен",
      edit: "Изменить",
      save: "Сохранить",
      cancel: "Отмена",
      saving: "Сохранение…",
      englishName: "Название на английском",
      russianName: "Название на русском",
      kazakhName: "Название на казахском",
      description: "Описание",
      versionConflict: "Запись была изменена. Показана последняя версия.",
      saveFailed: "Не удалось сохранить запись.",
    },
  },
  kk: {
    translation: {
      appEyebrow: "Теміржол өнімдерін сертификаттау жұмыс кеңістігі",
      appName: "Certified Loco",
      firstRelease: "Бірінші нұсқа",
      headline: "Дәлелдері тексерілетін сертификаттау бағалауы.",
      intro:
        "Расталған сертификаттан бастап, тарихи сынақ бағдарламасын жарияланған талаптармен салыстырыңыз және әр нәтиженің бастапқы көзін сақтаңыз.",
      newAssessment: "Жаңа бағалау — жақында",
      assessments: "Бағалаулар",
      assessmentsDescription:
        "Бөлшектің тарихи бағдарламасын қолданыстағы талаптармен салыстыру.",
      knowledgeCatalogue: "Білім каталогы",
      knowledgeCatalogueDescription:
        "Бөлшектерді, сынақтарды, стандарттарды, нормативтерді және сертификаттарды басқару.",
      reviewAndPublish: "Тексеру және жариялау",
      reviewAndPublishDescription:
        "Талаптар өзгерістерін пайдаланушыларға қолжетімді етпес бұрын бекіту.",
      connectedData: "Қосылған деректер",
      productCategories: "Өнім санаттары",
      records: "жазба",
      loadingCatalogue: "Каталог жүктелуде…",
      catalogueUnavailable: "Каталог қолжетімсіз. Дерекқор байланысын тексеріңіз.",
      noCategories: "Өнім санаттары әлі қосылмаған.",
      checkingApi: "API тексерілуде",
      apiConnected: "API қосылған",
      apiUnavailable: "API қолжетімсіз",
      edit: "Өзгерту",
      save: "Сақтау",
      cancel: "Бас тарту",
      saving: "Сақталуда…",
      englishName: "Ағылшынша атауы",
      russianName: "Орысша атауы",
      kazakhName: "Қазақша атауы",
      description: "Сипаттама",
      versionConflict: "Жазба өзгертілді. Соңғы нұсқа көрсетілді.",
      saveFailed: "Жазбаны сақтау мүмкін болмады.",
    },
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export type Locale = keyof typeof resources;
export default i18n;
