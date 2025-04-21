import express from "express";

const router = express.Router();

// Index Page
router.get("/", (req, res) => {
  const t = req.t; // Translation function provided by i18next middleware

  // Automatically load all translations for the current namespace
  const translations = {
    apiDocsUrl: `/api-docs`,
    ...t("index", { returnObjects: true }), // Load all keys under the "index" namespace
  };

  res.render("index", translations);
});

export default router;