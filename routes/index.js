import express from "express";
import debugLog from "../utils/debugLog.js";

const router = express.Router();

router.get("/", (req, res) => {
  debugLog("[DEBUG] Rendering index page");
  const t = req.t;

  const translations = {
    apiDocsUrl: `/api-docs`,
    ...t("index", { returnObjects: true }),
  };

  debugLog("[DEBUG] Translations loaded for index page");
  res.render("index", translations);
});

export default router;