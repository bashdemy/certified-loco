import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { AssessmentResultState } from "../domain/assessment-engine";

export const resources = {
  en: {
    translation: {
      appEyebrow: "Republic of Kazakhstan · EAEU Railway Certification (ТР ТС 001/2011)",
      appName: "Certified Loco",
      firstRelease: "Kazakhstan Conformity Assessment & Annual Surveillance (v1)",
      headline:
        "Check a previous year's certificate to see what must be tested or re-certified this year.",
      intro:
        "Built for Republic of Kazakhstan conformity assessment bodies (ОПС) and manufacturers under Law of RK No. 396-VI 'On Technical Regulation', Conformity Assessment Rules No. 433-NK, and EAEU Technical Regulation ТР ТС 001/2011. Select an existing certificate to immediately highlight tests that can be credited, norms that changed, and new mandatory tests required this year.",
      newAssessment: "Check certificate for this year",
      assessments: "Year-over-Year Certificate Check",
      assessmentsDescription:
        "Compare a previous year's certificate and test protocols against current ТР ТС 001/2011 and ГОСТ requirements.",
      knowledgeCatalogue: "Certificates & Standards Register",
      knowledgeCatalogueDescription:
        "Maintain certificates, historical test protocols, rolling stock categories, ГОСТ standards, and regulations.",
      reviewAndPublish: "Regulatory Dataset Approval",
      reviewAndPublishDescription:
        "Verify and publish updated ТР ТС 001/2011 & ГОСТ requirement snapshots with clause-level provenance.",
      legalBasisBannerTitle: "Regulatory basis (Republic of Kazakhstan & EAEU):",
      legalBasisBannerText:
        "Law of RK No. 396-VI 'On Technical Regulation' (30.12.2020) · Order of MTI RK No. 433-NK 'Rules of Conformity Assessment' (scheduled annual inspection control under schemes 3c/4c & re-certification) · ТР ТС 001/2011 'On Safety of Railway Rolling Stock' (EEC Decision No. 710).",
      connectedData: "Reference register",
      productCategories: "Rolling stock component categories",
      records: "records",
      loadingCatalogue: "Loading register…",
      catalogueUnavailable: "Register unavailable. Check the database connection.",
      noCategories: "No product categories have been seeded yet.",
      checkingApi: "Checking API",
      apiConnected: "System online",
      apiUnavailable: "API unavailable",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      saving: "Saving…",
      englishName: "Name in English",
      russianName: "Name in Russian",
      kazakhName: "Name in Kazakh",
      description: "Description",
      versionConflict: "This record changed elsewhere. The latest version is shown.",
      saveFailed: "Could not save this record.",
      auditHistory: "Audit log of changes",
      auditUnavailable: "Audit history unavailable.",
      noAuditEvents: "No changes recorded yet.",
      certificates: "Certificates from previous years",
      newCertificate: "Add certificate",
      certificateNumber: "Certificate number (ЕАЭС KZ…)",
      productCategory: "Component category",
      selectCategory: "Select a category",
      productName: "Product name & drawing",
      productModel: "Model / modification",
      manufacturer: "Manufacturer",
      applicant: "Applicant (RK resident / manufacturer)",
      regulationCode: "Technical regulation",
      certificationScheme: "Certification scheme (e.g. 3c)",
      issuedAt: "Issued date",
      expiresAt: "Expiry date",
      create: "Create",
      creating: "Creating…",
      certificateCreated: "Certificate created.",
      certificateFailed: "Could not create the certificate.",
      loadingCertificates: "Loading certificates…",
      certificatesUnavailable: "Certificates unavailable.",
      noCertificates: "No certificates have been recorded yet.",
      uploadDocument: "Attach scan / protocol (PDF)",
      uploadingDocument: "Uploading…",
      documentUploaded: "PDF document attached.",
      documentUploadFailed: "Could not upload the document.",
      confirmed: "Confirmed",
      unconfirmed: "Pending confirmation",
      confirmRevision: "Confirm certificate data",
      newRevision: "New revision",
      addHistoricalTest: "Add test from protocol",
      historicalTests: "Tests performed under previous certificate",
      noHistoricalTests: "No historical tests recorded on this revision.",
      regulatoryDatasets: "Current year regulatory requirement datasets",
      publishDataset: "Publish dataset",
      publishing: "Publishing…",
      publishReasonPlaceholder: "Basis for publication (e.g. EEC Order / annual update)…",
      approveRequirement: "Approve",
      rejectRequirement: "Reject",
      publishedLockedNotice: "Active published dataset",
      supersededNotice: "Superseded",
      draftNotice: "Draft",
      assessmentDate: "Target certification / inspection date (this year)",
      selectCertificateRevision: "Select previous certificate to check",
      runAssessmentButton: "Determine what must be certified this year",
      runningAssessment: "Comparing protocols with current norms…",
      noAssessments:
        "No assessments have been run yet. Select a certificate above and click the button.",
      viewEvidence: "Legal basis & clause comparison",
      testsCatalogue: "ГОСТ Standards, Regulations & Laboratory Tests",
      newCategory: "New category",
      categoryCode: "Category code",
      archive: "Archive",
      signInTitle: "Sign in to Certified Loco",
      signInSubtitle:
        "Enter your email and password to access the railway certification workspace.",
      emailLabel: "Email address",
      passwordLabel: "Password",
      signInButton: "Sign in",
      signingIn: "Signing in…",
      signOutButton: "Sign out",
      invalidCredentials: "Invalid email or password.",
      manageAccounts: "Team accounts",
      accountUpdated: "Account updated.",
      accountSettingsSubtitle:
        "Configure your account and your dad's account (leave password blank to keep current).",
      accountOwnerHeading: "Account 1 · Owner",
      accountDadHeading: "Account 2 · Dad",
      accountNameLabel: "Display name",
      accountRoleLabel: "Access role",
      accountRoleAdmin: "Admin (full access)",
      accountRoleUser: "Specialist (read-only)",
      accountNewPasswordLabel: "New password (min 8 chars, optional)",
      state_required: "Credited (No changes)",
      state_changed: "Norm changed — Re-test required",
      state_additional: "New requirement — Lab test needed",
      state_historical_only: "Historical only (No longer required)",
      state_review: "Expert review required",
      overall_ready: "Action plan ready",
      overall_review: "Requires expert review",
      actionSummaryTitle:
        "What needs to be done for this year's certification / inspection:",
      summaryCreditedCard: "Credited from previous certificate",
      summaryCreditedHint: "Norms and ГОСТ clauses unchanged — existing protocol applies",
      summaryRetestCard: "Re-testing required (Norm changed)",
      summaryRetestHint: "Standard parameter or clause updated since certificate issue",
      summaryNewTestCard: "New laboratory tests required",
      summaryNewTestHint:
        "Mandatory in current dataset but absent in previous certificate",
      summaryReviewCard: "Expert verification needed",
      summaryReviewHint: "Check unconfirmed metadata or parameter units",
      previousCertValueLabel: "In previous certificate:",
      currentYearNormLabel: "Required this year:",
      protocolLabel: "Protocol:",
      standardClausePlaceholder: "Clause (e.g. п. 5.2.4)",
      parametersJsonPlaceholder: 'Parameters JSON (e.g. {"minForceKnPerMm": 4.5})',
      selectTestPlaceholder: "Select laboratory test…",
      selectStandardPlaceholder: "Select ГОСТ standard version…",
      datasetLabel: "Active dataset:",
      effectivePeriodLabel: "Effective period:",
      openEndedLabel: "present",
      sourceCitationLabel: "Official source:",
      addTestButton: "+ Add laboratory test",
      testCodePlaceholder: "Test code",
      testNamePlaceholder: "Test name",
      testMethodPlaceholder: "Test method",
      regulationsHeading: "Technical Regulations",
      standardsHeading: "Interstate Standards (ГОСТ)",
      testsHeading: "Laboratory Tests",
      reviewStatus_approved: "Approved",
      reviewStatus_pending_review: "Pending review",
      reviewStatus_rejected: "Rejected",
      certificateValidityLabel: "Validity period",
      certificationSchemeShort: "Scheme",
      tabYearlyCheck: "1. Check Certificate for This Year",
      tabCertificates: "2. Past Certificates & Protocols",
      tabNorms: "3. ТР ТС & ГОСТ Standards Base",
      checkThisCertButton: "Check requirements for this year →",
      protocolNumberPlaceholder: "Protocol number (e.g. ИЛ-2023-089)",
    },
  },
  ru: {
    translation: {
      appEyebrow:
        "Республика Казахстан · Сертификация ж/д продукции ЕАЭС (ТР ТС 001/2011)",
      appName: "Certified Loco",
      firstRelease: "Оценка соответствия и инспекционный контроль в РК (v1)",
      headline:
        "Проверка сертификата прошлого года: что необходимо испытать и сертифицировать в этом году.",
      intro:
        "Система для органов по подтверждению соответствия (ОПС), испытательных лабораторий и производителей Республики Казахстан согласно Закону РК № 396-VI «О техническом регулировании», Правилам оценки соответствия № 433-НҚ и ТР ТС 001/2011. Выберите действующий или прошлый сертификат, чтобы сразу увидеть: какие протоколы испытаний засчитываются, какие нормы ГОСТ изменились и какие новые испытания нужно провести в этом году.",
      newAssessment: "Проверить сертификат на этот год",
      assessments: "Проверка сертификата на требования текущего года",
      assessmentsDescription:
        "Сравнение протоколов испытаний прошлого сертификата с действующими нормами ТР ТС 001/2011 и ГОСТ.",
      knowledgeCatalogue: "Реестр сертификатов и нормативной базы",
      knowledgeCatalogueDescription:
        "Сертификаты соответствия ЕАЭС KZ, протоколы испытаний, категории узлов подвижного состава, ГОСТ и ТР ТС.",
      reviewAndPublish: "Утверждение нормативных требований",
      reviewAndPublishDescription:
        "Проверка и публикация актуальных наборов требований ТР ТС 001/2011 и перечня стандартов ГОСТ.",
      legalBasisBannerTitle: "Нормативно-правовая база (Республика Казахстан и ЕАЭС):",
      legalBasisBannerText:
        "Закон РК от 30.12.2020 № 396-VI «О техническом регулировании» · Приказ МТИ РК от 29.06.2021 № 433-НҚ «Правила оценки соответствия» (плановый инспекционный контроль по схемам 3с/4с и повторная сертификация) · ТР ТС 001/2011 «О безопасности железнодорожного подвижного состава» (Решение КТС № 710).",
      connectedData: "Справочный реестр",
      productCategories: "Категории составных частей подвижного состава",
      records: "записей",
      loadingCatalogue: "Загрузка реестра…",
      catalogueUnavailable: "Реестр недоступен. Проверьте подключение к базе данных.",
      noCategories: "Категории продукции ещё не добавлены.",
      checkingApi: "Проверка соединения",
      apiConnected: "Система подключена",
      apiUnavailable: "Сервер недоступен",
      edit: "Изменить",
      save: "Сохранить",
      cancel: "Отмена",
      saving: "Сохранение…",
      englishName: "Название на английском",
      russianName: "Название на русском",
      kazakhName: "Название на казахском",
      description: "Описание и область применения",
      versionConflict:
        "Запись была изменена другим пользователем. Показана актуальная версия.",
      saveFailed: "Не удалось сохранить изменения.",
      auditHistory: "Журнал аудита изменений",
      auditUnavailable: "Журнал изменений недоступен.",
      noAuditEvents: "Изменений в реестре пока не зафиксировано.",
      certificates: "Сертификаты соответствия прошлых лет",
      newCertificate: "Добавить сертификат",
      certificateNumber: "Номер сертификата (ЕАЭС KZ…)",
      productCategory: "Категория составной части",
      selectCategory: "Выберите категорию",
      productName: "Наименование продукции и чертёж",
      productModel: "Модель / исполнение",
      manufacturer: "Изготовитель",
      applicant: "Заявитель (резидент РК / изготовитель)",
      regulationCode: "Технический регламент",
      certificationScheme: "Схема сертификации (напр. 3с)",
      issuedAt: "Дата выдачи",
      expiresAt: "Срок действия до",
      create: "Создать",
      creating: "Создание…",
      certificateCreated: "Сертификат добавлен в реестр.",
      certificateFailed: "Не удалось создать сертификат.",
      loadingCertificates: "Загрузка сертификатов…",
      certificatesUnavailable: "Сертификаты недоступны.",
      noCertificates: "Сертификаты ещё не добавлены.",
      uploadDocument: "Прикрепить скан / протокол (PDF)",
      uploadingDocument: "Загрузка…",
      documentUploaded: "PDF-документ прикреплён.",
      documentUploadFailed: "Не удалось загрузить документ.",
      confirmed: "Подтверждён",
      unconfirmed: "Ожидает подтверждения",
      confirmRevision: "Подтвердить данные сертификата",
      newRevision: "Новая редакция",
      addHistoricalTest: "Добавить испытание из протокола",
      historicalTests: "Испытания по протоколам прошлого сертификата",
      noHistoricalTests: "Испытания для этой редакции сертификата ещё не внесены.",
      regulatoryDatasets: "Действующие наборы требований ТР ТС и ГОСТ",
      publishDataset: "Опубликовать набор требований",
      publishing: "Публикация…",
      publishReasonPlaceholder:
        "Основание публикации (Решение Коллегии ЕЭК / актуализация ГОСТ)…",
      approveRequirement: "Утвердить",
      rejectRequirement: "Отклонить",
      publishedLockedNotice: "Действующий опубликованный набор",
      supersededNotice: "Заменён новой версией",
      draftNotice: "Проект (черновик)",
      assessmentDate: "Дата сертификации / инспекционного контроля (текущий год)",
      selectCertificateRevision: "Выберите сертификат прошлого периода для проверки",
      runAssessmentButton: "Определить перечень испытаний на этот год",
      runningAssessment: "Сравнение протоколов с актуальными нормами ГОСТ…",
      noAssessments:
        "Расчёты ещё не выполнялись. Выберите сертификат выше и нажмите кнопку проверки.",
      viewEvidence: "Нормативное обоснование и сравнение пунктов ГОСТ",
      testsCatalogue: "Стандарты ГОСТ, регламенты ТР ТС и виды испытаний",
      newCategory: "Добавить категорию",
      categoryCode: "Код категории",
      archive: "В архив",
      signInTitle: "Вход в систему Certified Loco",
      signInSubtitle:
        "Введите электронную почту и пароль для доступа к системе оценки соответствия.",
      emailLabel: "Электронная почта",
      passwordLabel: "Пароль",
      signInButton: "Войти в систему",
      signingIn: "Вход…",
      signOutButton: "Выйти",
      invalidCredentials: "Неверный адрес электронной почты или пароль.",
      manageAccounts: "Учётные записи",
      accountUpdated: "Учётная запись успешно обновлена.",
      accountSettingsSubtitle:
        "Настройка вашей учётной записи и учётной записи папы (оставьте поле пароля пустым, чтобы не менять его).",
      accountOwnerHeading: "Учётная запись 1 · Основная",
      accountDadHeading: "Учётная запись 2 · Папа",
      accountNameLabel: "Имя пользователя",
      accountRoleLabel: "Права доступа",
      accountRoleAdmin: "Администратор (полный доступ)",
      accountRoleUser: "Эксперт (только просмотр)",
      accountNewPasswordLabel: "Новый пароль (мин. 8 символов, необязательно)",
      state_required: "Зачтено по прошлому сертификату",
      state_changed: "Изменились нормы ГОСТ — Переиспытание",
      state_additional: "Новое требование — Доиспытание в ИЛ",
      state_historical_only: "Исключено из обязательных (Архив)",
      state_review: "Требует решения эксперта ОПС",
      overall_ready: "Заключение сформировано",
      overall_review: "Требует проверки эксперта",
      actionSummaryTitle:
        "Итог проверки сертификата на текущий год (что нужно сертифицировать):",
      summaryCreditedCard: "Засчитывается без переиспытаний",
      summaryCreditedHint:
        "Пункты ГОСТ и нормативы не изменились — действует прежний протокол",
      summaryRetestCard: "Требуется переиспытание (нормы изменились)",
      summaryRetestHint: "Ужесточены параметры или изменён пункт стандарта со дня выдачи",
      summaryNewTestCard: "Новые обязательные испытания в ИЛ",
      summaryNewTestHint:
        "Обязательны по действующему ТР ТС / ГОСТ, но отсутствовали в прошлом сертификате",
      summaryReviewCard: "На проверку эксперту ОПС",
      summaryReviewHint: "Требуется верификация методики или неподтверждённых данных",
      previousCertValueLabel: "Было в прошлом сертификате:",
      currentYearNormLabel: "Требуется в этом году:",
      protocolLabel: "Протокол:",
      standardClausePlaceholder: "Пункт ГОСТ (напр. п. 5.2.4)",
      parametersJsonPlaceholder: 'Параметры JSON (напр. {"minForceKnPerMm": 4.5})',
      selectTestPlaceholder: "Выберите вид испытания…",
      selectStandardPlaceholder: "Выберите редакцию стандарта ГОСТ…",
      datasetLabel: "Нормативный набор:",
      effectivePeriodLabel: "Период действия норм:",
      openEndedLabel: "по настоящее время",
      sourceCitationLabel: "Официальный источник:",
      addTestButton: "+ Добавить испытание",
      testCodePlaceholder: "Код испытания",
      testNamePlaceholder: "Наименование испытания",
      testMethodPlaceholder: "Метод контроля / ГОСТ",
      regulationsHeading: "Технические регламенты",
      standardsHeading: "Межгосударственные стандарты (ГОСТ)",
      testsHeading: "Виды лабораторных испытаний",
      reviewStatus_approved: "Утверждено",
      reviewStatus_pending_review: "На проверке",
      reviewStatus_rejected: "Отклонено",
      certificateValidityLabel: "Срок действия",
      certificationSchemeShort: "Схема",
      tabYearlyCheck: "1. Проверка сертификата на этот год",
      tabCertificates: "2. Сертификаты и протоколы прошлых лет",
      tabNorms: "3. Нормативы ТР ТС и ГОСТ",
      checkThisCertButton: "Проверить требования на этот год →",
      protocolNumberPlaceholder: "Номер протокола ИЛ (напр. ИЛ-2023-089)",
    },
  },
  kk: {
    translation: {
      appEyebrow:
        "Қазақстан Республикасы · ЕАЭО теміржол өнімдерін сертификаттау (КО ТР 001/2011)",
      appName: "Certified Loco",
      firstRelease: "ҚР сәйкестікті бағалау және инспекциялық бақылау (v1)",
      headline:
        "Өткен жылғы сертификатты тексеру: биыл қандай сынақтар мен сертификаттау қажет екенін анықтау.",
      intro:
        "ҚР 30.12.2020 ж. № 396-VI «Техникалық реттеу туралы» Заңына, № 433-НҚ Сәйкестікті бағалау қағидаларына және КО ТР 001/2011 регламентіне сәйкес сәйкестікті растау органдары (СРО) мен өндірушілерге арналған жүйе. Алдыңғы сертификатты таңдап, қай сынақ хаттамалары есепке алынатынын, қай МЕМСТ нормалары өзгергенін және биыл қандай жаңа сынақтар қажет екенін бірден көріңіз.",
      newAssessment: "Биылғы жылға сертификатты тексеру",
      assessments: "Сертификатты ағымдағы жылдың талаптарына тексеру",
      assessmentsDescription:
        "Алдыңғы сертификаттың сынақ хаттамаларын қолданыстағы КО ТР 001/2011 және МЕМСТ нормаларымен салыстыру.",
      knowledgeCatalogue: "Сертификаттар мен стандарттар тізілімі",
      knowledgeCatalogueDescription:
        "ЕАЭО KZ сәйкестік сертификаттары, сынақ хаттамалары, жылжымалы құрам бөлшектері, МЕМСТ және ТР.",
      reviewAndPublish: "Нормативтік талаптарды бекіту",
      reviewAndPublishDescription:
        "КО ТР 001/2011 және МЕМСТ стандарттарының өзекті талаптар жиынтығын тексеру және жариялау.",
      legalBasisBannerTitle:
        "Нормативтік-құқықтық негіз (Қазақстан Республикасы және ЕАЭО):",
      legalBasisBannerText:
        "ҚР 30.12.2020 ж. № 396-VI «Техникалық реттеу туралы» Заңы · ҚР СИМ 29.06.2021 ж. № 433-НҚ «Сәйкестікті бағалау қағидалары» (3с/4с схемалары бойынша жоспарлы инспекциялық бақылау және қайта сертификаттау) · КО ТР 001/2011 «Теміржол жылжымалы құрамының қауіпсіздігі туралы».",
      connectedData: "Анықтамалық тізілім",
      productCategories: "Жылжымалы құрамның құрамдас бөліктерінің санаттары",
      records: "жазба",
      loadingCatalogue: "Тізілім жүктелуде…",
      catalogueUnavailable: "Тізілім қолжетімсіз. Дерекқор байланысын тексеріңіз.",
      noCategories: "Өнім санаттары әлі қосылмаған.",
      checkingApi: "Байланыс тексерілуде",
      apiConnected: "Жүйе қосылған",
      apiUnavailable: "Сервер қолжетімсіз",
      edit: "Өзгерту",
      save: "Сақтау",
      cancel: "Бас тарту",
      saving: "Сақталуда…",
      englishName: "Ағылшынша атауы",
      russianName: "Орысша атауы",
      kazakhName: "Қазақша атауы",
      description: "Сипаттамасы және қолдану саласы",
      versionConflict: "Жазба өзгертілді. Соңғы нұсқа көрсетілді.",
      saveFailed: "Жазбаны сақтау мүмкін болмады.",
      auditHistory: "Өзгерістер аудиті журналы",
      auditUnavailable: "Өзгерістер тарихы қолжетімсіз.",
      noAuditEvents: "Тізілімде әлі өзгеріс жоқ.",
      certificates: "Өткен жылдардағы сәйкестік сертификаттары",
      newCertificate: "Сертификат қосу",
      certificateNumber: "Сертификат нөмірі (ЕАЭО KZ…)",
      productCategory: "Құрамдас бөлік санаты",
      selectCategory: "Санатты таңдаңыз",
      productName: "Өнім атауы және сызбасы",
      productModel: "Моделі / модификациясы",
      manufacturer: "Өндіруші",
      applicant: "Өтініш беруші (ҚР резиденті / өндіруші)",
      regulationCode: "Техникалық регламент",
      certificationScheme: "Сертификаттау схемасы (мысалы 3с)",
      issuedAt: "Берілген күні",
      expiresAt: "Жарамдылық мерзімі",
      create: "Құру",
      creating: "Құрылуда…",
      certificateCreated: "Сертификат тізілімге қосылды.",
      certificateFailed: "Сертификатты құру мүмкін болмады.",
      loadingCertificates: "Сертификаттар жүктелуде…",
      certificatesUnavailable: "Сертификаттар қолжетімсіз.",
      noCertificates: "Сертификаттар әлі қосылмаған.",
      uploadDocument: "Скан / хаттаманы тіркеу (PDF)",
      uploadingDocument: "Жүктелуде…",
      documentUploaded: "PDF құжат тіркелді.",
      documentUploadFailed: "Құжатты жүктеу мүмкін болмады.",
      confirmed: "Расталған",
      unconfirmed: "Растауды күтуде",
      confirmRevision: "Сертификат деректерін растау",
      newRevision: "Жаңа редакция",
      addHistoricalTest: "Хаттамадан сынақ қосу",
      historicalTests: "Алдыңғы сертификат хаттамалары бойынша сынақтар",
      noHistoricalTests: "Бұл редакция үшін сынақтар әлі енгізілмеген.",
      regulatoryDatasets: "Қолданыстағы КО ТР және МЕМСТ талаптар жиынтығы",
      publishDataset: "Талаптар жиынтығын жариялау",
      publishing: "Жариялануда…",
      publishReasonPlaceholder: "Жариялау негізі (ЕЭК Алқасының шешімі / МЕМСТ жаңарту)…",
      approveRequirement: "Бекіту",
      rejectRequirement: "Қабылдамау",
      publishedLockedNotice: "Қолданыстағы жарияланған жиынтық",
      supersededNotice: "Жаңа нұсқамен ауыстырылған",
      draftNotice: "Жоба (қаралама)",
      assessmentDate: "Сертификаттау / инспекциялық бақылау күні (ағымдағы жыл)",
      selectCertificateRevision: "Тексеру үшін өткен кезеңдегі сертификатты таңдаңыз",
      runAssessmentButton: "Биылғы жылға қажетті сынақтар тізімін анықтау",
      runningAssessment: "Хаттамаларды қолданыстағы МЕМСТ нормаларымен салыстыру…",
      noAssessments:
        "Есептеулер әлі орындалмаған. Жоғарыдан сертификатты таңдап, тексеру түймесін басыңыз.",
      viewEvidence: "Нормативтік негіздеме және МЕМСТ тармақтарын салыстыру",
      testsCatalogue: "МЕМСТ стандарттары, КО ТР регламенттері және сынақ түрлері",
      newCategory: "Санат қосу",
      categoryCode: "Санат коды",
      archive: "Мұрағатқа",
      signInTitle: "Certified Loco жүйесіне кіру",
      signInSubtitle:
        "Сәйкестікті бағалау жүйесіне кіру үшін электрондық пошта мен құпиясөзді енгізіңіз.",
      emailLabel: "Электрондық пошта",
      passwordLabel: "Құпиясөз",
      signInButton: "Жүйеге кіру",
      signingIn: "Кіруде…",
      signOutButton: "Шығу",
      invalidCredentials: "Электрондық пошта немесе құпиясөз қате.",
      manageAccounts: "Тіркелгілер",
      accountUpdated: "Тіркелгі сәтті жаңартылды.",
      accountSettingsSubtitle:
        "Өз тіркелгіңізді және әкеңіздің тіркелгісін баптау (құпиясөзді өзгертпеу үшін бос қалдырыңыз).",
      accountOwnerHeading: "1-тіркелгі · Негізгі",
      accountDadHeading: "2-тіркелгі · Әкесі",
      accountNameLabel: "Пайдаланушы аты",
      accountRoleLabel: "Қол жеткізу рөлі",
      accountRoleAdmin: "Әкімші (толық қолжетімділік)",
      accountRoleUser: "Сарапшы (тек қарау)",
      accountNewPasswordLabel: "Жаңа құпиясөз (кемінде 8 таңба, міндетті емес)",
      state_required: "Алдыңғы сертификат бойынша есепке алынды",
      state_changed: "МЕМСТ нормалары өзгерді — Қайта сынау",
      state_additional: "Жаңа талап — Зертханада қосымша сынау",
      state_historical_only: "Міндетті тізімнен шығарылған (Мұрағат)",
      state_review: "СРО сарапшысының шешімін талап етеді",
      overall_ready: "Қорытынды дайын",
      overall_review: "Сарапшы тексеруін талап етеді",
      actionSummaryTitle:
        "Сертификатты ағымдағы жылға тексеру қорытындысы (нені сертификаттау қажет):",
      summaryCreditedCard: "Қайта сынаусыз есепке алынады",
      summaryCreditedHint:
        "МЕМСТ тармақтары мен нормативтер өзгерген жоқ — бұрынғы хаттама жарамды",
      summaryRetestCard: "Қайта сынау қажет (нормалар өзгерді)",
      summaryRetestHint:
        "Сертификат берілгеннен бері стандарт параметрі немесе тармағы жаңартылды",
      summaryNewTestCard: "Зертханада жаңа міндетті сынақтар",
      summaryNewTestHint:
        "Қолданыстағы КО ТР / МЕМСТ бойынша міндетті, бірақ алдыңғы сертификатта болмаған",
      summaryReviewCard: "СРО сарапшысының тексеруіне",
      summaryReviewHint: "Әдістемені немесе расталмаған деректерді тексеру қажет",
      previousCertValueLabel: "Алдыңғы сертификатта:",
      currentYearNormLabel: "Биылғы талап:",
      protocolLabel: "Хаттама:",
      standardClausePlaceholder: "МЕМСТ тармағы (мысалы 5.2.4 т.)",
      parametersJsonPlaceholder: 'JSON параметрлері (мысалы {"minForceKnPerMm": 4.5})',
      selectTestPlaceholder: "Сынақ түрін таңдаңыз…",
      selectStandardPlaceholder: "МЕМСТ стандартының нұсқасын таңдаңыз…",
      datasetLabel: "Нормативтік жиынтық:",
      effectivePeriodLabel: "Нормалардың қолданылу кезеңі:",
      openEndedLabel: "қазіргі уақытқа дейін",
      sourceCitationLabel: "Ресми дереккөз:",
      addTestButton: "+ Сынақ қосу",
      testCodePlaceholder: "Сынақ коды",
      testNamePlaceholder: "Сынақ атауы",
      testMethodPlaceholder: "Бақылау әдісі / МЕМСТ",
      regulationsHeading: "Техникалық регламенттер",
      standardsHeading: "Мемлекетаралық стандарттар (МЕМСТ)",
      testsHeading: "Зертханалық сынақ түрлері",
      reviewStatus_approved: "Бекітілді",
      reviewStatus_pending_review: "Тексеруде",
      reviewStatus_rejected: "Қабылданбады",
      certificateValidityLabel: "Жарамдылық мерзімі",
      certificationSchemeShort: "Схема",
      tabYearlyCheck: "1. Сертификатты биылға тексеру",
      tabCertificates: "2. Алдыңғы сертификаттар мен хаттамалар",
      tabNorms: "3. КО ТР және МЕМСТ нормативтері",
      checkThisCertButton: "Биылғы талаптарды тексеру →",
      protocolNumberPlaceholder: "Хаттама нөмірі (мысалы ИЛ-2023-089)",
    },
  },
} as const;

export type Locale = keyof typeof resources;

const KZ_AND_CIS_TIMEZONES = new Set([
  "Asia/Almaty",
  "Asia/Qyzylorda",
  "Asia/Aqtobe",
  "Asia/Aqtau",
  "Asia/Atyrau",
  "Asia/Oral",
  "Asia/Qostanay",
  "Europe/Moscow",
  "Asia/Bishkek",
  "Asia/Tashkent",
  "Europe/Minsk",
]);

export function detectInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }
  try {
    const manual = window.localStorage.getItem("cl_locale_manual");
    if (manual === "en" || manual === "ru" || manual === "kk") {
      return manual;
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && KZ_AND_CIS_TIMEZONES.has(tz)) {
      return "ru";
    }
    if (tz && tz.startsWith("Australia/")) {
      return "en";
    }
  } catch {
    // ignore storage/Intl errors
  }
  return "en";
}

const DOMAIN_TRANSLATIONS: Record<string, { en: string; ru: string; kk: string }> = {
  // Tests by code or name
  wheelset_ultrasonic_axle: {
    en: "Ultrasonic flaw detection of wheelset axle (ГОСТ 11018 / ГОСТ 33200)",
    ru: "Ультразвуковой контроль (УЗК) оси колесной пары на отсутствие внутренних дефектов",
    kk: "Дөңгелек жұбы осінің ішкі ақауларын ультрадыбыстық бақылау (УДБ)",
  },
  "Ultrasonic flaw detection of axle": {
    en: "Ultrasonic flaw detection of wheelset axle (ГОСТ 11018 / ГОСТ 33200)",
    ru: "Ультразвуковой контроль (УЗК) оси колесной пары на отсутствие внутренних дефектов",
    kk: "Дөңгелек жұбы осінің ішкі ақауларын ультрадыбыстық бақылау (УДБ)",
  },
  wheelset_press_fit_force: {
    en: "Wheel-to-axle press-fit force control & indicator diagram recording",
    ru: "Контроль конечного усилия запрессовки колеса на ось с записью диаграммы",
    kk: "Дөңгелекті оське престеп отырғызудың соңғы күшін диаграмма жазу арқылы бақылау",
  },
  "Wheel-to-axle press-fit force control": {
    en: "Wheel-to-axle press-fit force control & indicator diagram recording",
    ru: "Контроль конечного усилия запрессовки колеса на ось с записью диаграммы",
    kk: "Дөңгелекті оське престеп отырғызудың соңғы күшін диаграмма жазу арқылы бақылау",
  },
  wheelset_gauge_dimension: {
    en: "Internal distance between wheel inner faces (1440 mm gauge control)",
    ru: "Контроль расстояния между внутренними гранями ободьев колес (1440 мм для колеи 1520 мм)",
    kk: "Дөңгелек құрсауларының ішкі беттері арасындағы қашықтықты бақылау (1440 мм)",
  },
  "Internal distance between wheel inner faces": {
    en: "Internal distance between wheel inner faces (1440 mm gauge control)",
    ru: "Контроль расстояния между внутренними гранями ободьев колес (1440 мм для колеи 1520 мм)",
    kk: "Дөңгелек құрсауларының ішкі беттері арасындағы қашықтықты бақылау (1440 мм)",
  },
  wheelset_impact_bending_cold: {
    en: "Low-temperature impact toughness KCU at −40 °C (climatic zone УХЛ1 for RK)",
    ru: "Испытание на ударный изгиб (ударная вязкость KCU) при температуре −40 °C (климатическое исполнение УХЛ1 для РК)",
    kk: "−40 °C температурада соққылы иілуге (KCU соққы тұтқырлығы) сынау (ҚР үшін УХЛ1 климаттық орындалуы)",
  },
  "Low-temperature impact toughness (KCU)": {
    en: "Low-temperature impact toughness KCU at −40 °C (climatic zone УХЛ1 for RK)",
    ru: "Испытание на ударный изгиб (ударная вязкость KCU) при температуре −40 °C (климатическое исполнение УХЛ1 для РК)",
    kk: "−40 °C температурада соққылы иілуге (KCU соққы тұтқырлығы) сынау (ҚР үшін УХЛ1 климаттық орындалуы)",
  },
  wheelset_hardness_rim: {
    en: "Brinell hardness (HB) of wheel rim tread surface",
    ru: "Контроль твердости по Бринеллю (HB) металла обода колеса",
    kk: "Дөңгелек құрсауы металының Бринелль бойынша қаттылығын (HB) бақылау",
  },
  "Brinell hardness of wheel rim": {
    en: "Brinell hardness (HB) of wheel rim tread surface",
    ru: "Контроль твердости по Бринеллю (HB) металла обода колеса",
    kk: "Дөңгелек құрсауы металының Бринелль бойынша қаттылығын (HB) бақылау",
  },
  wheelset_magnetic_particle_axle: {
    en: "Magnetic particle inspection of axle journals and wheel seats (ГОСТ 33200-2014)",
    ru: "Магнитопорошковый контроль (МПК) шеек и подступичных частей оси (ГОСТ 33200-2014)",
    kk: "Ось мойындары мен күпшек асты бөліктерін магниттік-ұнтақтық бақылау (МЕМСТ 33200-2014)",
  },
  wheelset_electrical_resistance: {
    en: "Electrical resistance between wheelset tyres/rims for rail circuit signalling",
    ru: "Контроль электрического сопротивления между бандажами (ободьями) колесной пары (для цепей СЦБ КТЖ)",
    kk: "Дөңгелек жұбының құрсаулары арасындағы электрлік кедергіні бақылау (ҚТЖ СЦБ тізбектері үшін)",
  },
  // Regulations & Standards
  "On Safety of Railway Rolling Stock (О безопасности железнодорожного подвижного состава)":
    {
      en: "On Safety of Railway Rolling Stock (Technical Regulation of the Customs Union / EAEU)",
      ru: "О безопасности железнодорожного подвижного состава (Технический регламент Таможенного союза / ЕАЭС, утв. Решением КТС № 710)",
      kk: "Теміржол жылжымалы құрамының қауіпсіздігі туралы (Кеден одағының / ЕАЭО техникалық регламенті, КОК № 710 шешімі)",
    },
  "Traction rolling stock for 1520 mm gauge railways. Wheelsets. General specifications":
    {
      en: "Traction rolling stock for 1520 mm gauge railways. Wheelsets. General specifications",
      ru: "Тяговый подвижной состав железных дорог колеи 1520 мм. Колесные пары. Общие технические условия",
      kk: "1520 мм табанды теміржолдардың тартқыш жылжымалы құрамы. Дөңгелек жұптары. Жалпы техникалық шарттар",
    },
  "Wagon wheelsets. Specifications": {
    en: "Wheelsets for mainline railway wagons (1520 mm gauge). Specifications",
    ru: "Колесные пары вагонов магистральных железных дорог колеи 1520 мм. Технические условия",
    kk: "1520 мм табанды магистральдық теміржол вагондарының дөңгелек жұптары. Техникалық шарттар",
  },
  // Datasets
  "tr-ts-001-2011-wheelsets-v1": {
    en: "ТР ТС 001/2011 — Mandatory Certification Requirements for Wheelsets in RK (2026 Active Edition)",
    ru: "ТР ТС 001/2011 — Обязательные требования к сертификации и ИК колесных пар в РК (действующая редакция 2026 г.)",
    kk: "КО ТР 001/2011 — ҚР-да дөңгелек жұптарын сертификаттау және ИБ міндетті талаптары (2026 ж. қолданыстағы редакция)",
  },
  "ТР ТС 001/2011 — Wheelsets Baseline Dataset v1": {
    en: "ТР ТС 001/2011 — Mandatory Certification Requirements for Wheelsets in RK (2026 Active Edition)",
    ru: "ТР ТС 001/2011 — Обязательные требования к сертификации и ИК колесных пар в РК (действующая редакция 2026 г.)",
    kk: "КО ТР 001/2011 — ҚР-да дөңгелек жұптарын сертификаттау және ИБ міндетті талаптары (2026 ж. қолданыстағы редакция)",
  },
  // Certificates
  "Locomotive Wheelset KP-2M": {
    en: "Locomotive Wheelset KP-2M (Drawing ТЭ33А.30.50.000 for Evolution locomotives)",
    ru: "Колесная пара локомотивная КП-2М (черт. ТЭ33А.30.50.000 для тепловозов серии ТЭ33А)",
    kk: "КП-2М локомотив دөңгелек жұбы (ТЭ33А сериялы тепловоздарға арналған ТЭ33А.30.50.000 сызбасы)",
  },
  "Wagon Wheelset RU1Sh-957-G": {
    en: "Freight Wagon Wheelset RU1Sh-957-G (ГОСТ 4835-2013, 23.5 tf axle load)",
    ru: "Колесная пара вагонная РУ1Ш-957-Г (ГОСТ 4835-2013, осевая нагрузка 23,5 тс)",
    kk: "РУ1Ш-957-Г вагон дөңгелек жұбы (МЕМСТ 4835-2013, осьтік жүктемесі 23,5 тк)",
  },
  "PromMash Komplekt LLP": {
    en: "Prommashkomplekt LLP (Ekibastuz, Pavlodar Region, RK)",
    ru: "ТОО «Проммашкомплект» (г. Экибастуз, Павлодарская обл., РК)",
    kk: "«Проммашкомплект» ЖШС (Екібастұз қ., Павлодар обл., ҚР)",
  },
  "KazLoco Service LLP": {
    en: "JSC 'Lokomotiv Kurastyru Zauyty' (Astana, RK)",
    ru: "АО «Локомотив құрастыру зауыты» (г. Астана, РК)",
    kk: "«Локомотив құрастыру зауыты» АҚ (Астана қ., ҚР)",
  },
  "ZIKSTO JSC": {
    en: "JSC 'ZIKSTO' (Petropavlovsk, RK)",
    ru: "АО «ЗИКСТО» (г. Петропавловск, РК)",
    kk: "«ЗИКСТО» АҚ (Петропавл қ., ҚР)",
  },
  "Kamkor Wagon LLP": {
    en: "LLP 'Kamkor Wagon' (Astana, RK)",
    ru: "ТОО «Қамқор Вагон» (г. Астана, РК)",
    kk: "«Қамқор Вагон» ЖШС (Астана қ., ҚР)",
  },
  // Provisions & clauses
  "Article 4, Section 12; Annex 1, item 10": {
    en: "Art. 4, Sec. 12; Annex 1, item 10 (Traction rolling stock wheelsets)",
    ru: "Статья 4, п. 12; Приложение № 1, п. 10 (Колесные пары тягового подвижного состава)",
    kk: "4-бап, 12-т.; № 1 қосымша, 10-т. (Тартқыш жылжымалы құрамның дөңгелек жұптары)",
  },
  "Article 4, Section 12; Annex 1, item 11": {
    en: "Art. 4, Sec. 12; Annex 1, item 11 (Wagon wheelsets)",
    ru: "Статья 4, п. 12; Приложение № 1, п. 11 (Колесные пары вагонов)",
    kk: "4-бап, 12-т.; № 1 қосымша, 11-т. (Вагондардың дөңгелек жұптары)",
  },
  "ТР ТС 001/2011 & ГОСТ 11018-2011 Official Register": {
    en: "EEC Decision No. 710 (ТР ТС 001/2011) & Interstate Standard ГОСТ 11018-2011 (KAZSTANDART Register)",
    ru: "Решение КТС № 710 (ТР ТС 001/2011) и Перечень стандартов к ТР ТС 001/2011 (ГОСТ 11018-2011, реестр КазСтандарт)",
    kk: "КОК № 710 шешімі (КО ТР 001/2011) және МЕМСТ 11018-2011 стандарты (ҚазСтандарт тізілімі)",
  },
  "ТР ТС 001/2011 & ГОСТ 4835-2013 Official Register": {
    en: "EEC Decision No. 710 (ТР ТС 001/2011) & Interstate Standard ГОСТ 4835-2013 (KAZSTANDART Register)",
    ru: "Решение КТС № 710 (ТР ТС 001/2011) и Перечень стандартов к ТР ТС 001/2011 (ГОСТ 4835-2013, реестр КазСтандарт)",
    kk: "КОК № 710 шешімі (КО ТР 001/2011) және МЕМСТ 4835-2013 стандарты (ҚазСтандарт тізілімі)",
  },
};

const PARAMETER_LABELS: Record<string, { en: string; ru: string; kk: string }> = {
  sensitivityMm2: {
    en: "Flaw sensitivity (mm²)",
    ru: "Эквивалентная площадь дефекта (мм²)",
    kk: "Ақаудың эквивалентті ауданы (мм²)",
  },
  coveragePercent: {
    en: "Inspection coverage (%)",
    ru: "Объём контроля партий (%)",
    kk: "Партияны бақылау көлемі (%)",
  },
  minForceKnPerMm: {
    en: "Min press-fit force per 100 mm dia (kN)",
    ru: "Мин. усилие запрессовки на 100 мм диаметра (кН/мм)",
    kk: "100 мм диаметрге мин. престеу күші (кН/мм)",
  },
  sampleCount: {
    en: "Samples per batch (pcs)",
    ru: "Количество образцов от партии (шт.)",
    kk: "Партиядан үлгілер саны (дана)",
  },
  nominalMm: {
    en: "Nominal distance (mm)",
    ru: "Номинальный размер (мм)",
    kk: "Номиналды өлшем (мм)",
  },
  toleranceMm: {
    en: "Permissible tolerance (±mm)",
    ru: "Допускаемое отклонение (±мм)",
    kk: "Рұқсат етілген ауытқу (±мм)",
  },
  temperatureC: {
    en: "Test temperature (°C)",
    ru: "Температура испытаний (°C)",
    kk: "Сынақ температурасы (°C)",
  },
  minHB: {
    en: "Min Brinell hardness (HB)",
    ru: "Твердость обода не менее (HB)",
    kk: "Құрсау қаттылығы кемінде (HB)",
  },
  maxOhm: {
    en: "Max electrical resistance (Ohm)",
    ru: "Электрическое сопротивление не более (Ом)",
    kk: "Электрлік кедергі көп дегенде (Ом)",
  },
};

export function localizeDomainText(
  text: string | null | undefined,
  locale: Locale,
): string {
  if (!text) return "";
  const entry = DOMAIN_TRANSLATIONS[text];
  if (entry) return entry[locale];
  if (locale === "ru") {
    return text
      .replace(/^Clause\s+/i, "п. ")
      .replace(/Section\s+/gi, "разд. ")
      .replace(/Annex\s+/gi, "Прил. ")
      .replace(/Protocol\s+/gi, "Протокол ИЛ № ")
      .replace(/,\s*p\.\s*/gi, ", стр. ");
  }
  if (locale === "kk") {
    return text
      .replace(/^Clause\s+/i, "т. ")
      .replace(/Section\s+/gi, "бөл. ")
      .replace(/Annex\s+/gi, "Қос. ")
      .replace(/Protocol\s+/gi, "СЗ хаттамасы № ")
      .replace(/,\s*p\.\s*/gi, ", бет ");
  }
  return text;
}

export function getParameterLabel(key: string, locale: Locale): string {
  return PARAMETER_LABELS[key]?.[locale] ?? key;
}

export function formatParametersLocalized(
  params: Record<string, unknown> | null | undefined,
  locale: Locale,
): string {
  if (!params || Object.keys(params).length === 0) {
    return locale === "ru"
      ? "по методике ГОСТ"
      : locale === "kk"
        ? "МЕМСТ әдістемесі бойынша"
        : "per standard";
  }
  return Object.entries(params)
    .map(([key, val]) => {
      const label = PARAMETER_LABELS[key]?.[locale] ?? key;
      return `${label}: ${String(val)}`;
    })
    .join(" · ");
}

export function localizeAssessmentReason(
  state: AssessmentResultState,
  rawReason: string,
  locale: Locale,
): string {
  if (locale === "en") return rawReason;
  if (state === "required") {
    return locale === "ru"
      ? "Протокол испытаний прошлого сертификата полностью соответствует действующим нормам ТР ТС 001/2011 и ГОСТ. При плановом инспекционном контроле (ст. 32 Закона РК «О техническом регулировании», схема 3с) методика и нормативные значения не изменились."
      : "Алдыңғы сертификаттың сынақ хаттамасы қолданыстағы КО ТР 001/2011 және МЕМСТ нормаларына толық сәйкес келеді. Нормативтік мәндер өзгерген жоқ.";
  }
  if (state === "changed") {
    return locale === "ru"
      ? "Внимание: с момента выдачи предыдущего сертификата изменились нормативные параметры или пункт стандарта ГОСТ. Для продления / инспекционного контроля в этом году требуется проведение повторных испытаний в аккредитованной ИЛ по обновлённым нормам."
      : "Назар аударыңыз: алдыңғы сертификат берілгеннен бері МЕМСТ стандартының нормативтік параметрлері өзгерді. Биыл аккредиттелген зертханада жаңартылған нормалар бойынша қайта сынау қажет.";
  }
  if (state === "additional") {
    return locale === "ru"
      ? "Обязательное испытание по действующему перечню стандартов к ТР ТС 001/2011 (исполнение УХЛ1 для климатических условий РК), которое отсутствовало в программе испытаний прошлого сертификата. Необходимо направление образцов в ИЛ для доиспытаний."
      : "Алдыңғы сертификаттың сынақ бағдарламасында болмаған, бірақ биыл КО ТР 001/2011 бойынша міндетті сынақ. Зертханада қосымша сынау жүргізу қажет.";
  }
  if (state === "historical_only") {
    return locale === "ru"
      ? "Испытание присутствовало в прошлом сертификате, но не требуется по действующему опубликованному набору норм ТР ТС 001/2011 на выбранную дату."
      : "Сынақ алдыңғы сертификатта болған, бірақ таңдалған күнге қолданыстағы КО ТР 001/2011 жиынтығы бойынша талап етілмейді.";
  }
  return locale === "ru"
    ? "Требуется проверка экспертом ОПС (проверьте подтверждение данных сертификата или полноту реквизитов протокола)."
    : "СРО сарапшысының тексеруі қажет (сертификат деректерінің расталғанын немесе хаттама деректемелерін тексеріңіз).";
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialLocale(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
