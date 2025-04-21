import i18next from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";
import path from "path";

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    preload: ["en", "pt-BR"], // Preload supported languages
    backend: {
      loadPath: path.resolve("./locales/{{lng}}/{{ns}}.json"), // Path to translation files
    },
    detection: {
      order: ["querystring", "cookie", "header"], // Detect language from query, cookies, or headers
      caches: ["cookie"], // Cache the detected language in cookies
    },
  });

export default i18next;