import express from "express";
import { chromium } from "playwright";
import debugLog from "../utils/debugLog.js";

const router = express.Router();

/**
 * @swagger
 * /get-mp4:
 *   get:
 *     summary: Get an MP4 URL from an embed URL.
 *     description: This endpoint fetches an MP4 URL from the provided embed URL using Playwright.
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         required: true
 *         description: The embed URL to process.
 *       - in: query
 *         name: webplayer
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Whether to render the video in a web player.
 *     responses:
 *       200:
 *         description: Successfully retrieved the MP4 URL.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mp4Url:
 *                   type: string
 *                   description: The MP4 URL.
 *       400:
 *         description: Missing or invalid URL parameter.
 *       404:
 *         description: No MP4 URL found.
 *       500:
 *         description: Error executing Playwright script.
 */
router.get("/get-mp4", async (req, res) => {
  const embedUrl = req.query.url;
  const webplayer = req.query.webplayer === "true";

  debugLog("[DEBUG] Received request to /get-mp4");
  debugLog(`[DEBUG] Embed URL: ${embedUrl}`);
  debugLog(`[DEBUG] Webplayer mode: ${webplayer}`);

  if (!embedUrl) {
    console.error("[ERROR] Missing URL parameter");
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  const appHost = req.hostname;
  const parentParam = `&parent=${appHost}`;
  const updatedEmbedUrl = embedUrl.includes("&parent=")
    ? embedUrl.replace(/&parent=[^&]*/, parentParam)
    : embedUrl + parentParam;

  debugLog(`[DEBUG] Updated Embed URL with parent parameter: ${updatedEmbedUrl}`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    debugLog("[DEBUG] Browser launched");

    const page = await browser.newPage();
    debugLog("[DEBUG] New page created in browser");

    let foundUrl = null;

    const navigationTimeout = 10000;

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes(".mp4") && !foundUrl) {
        foundUrl = url;
        debugLog(`[DEBUG] Found MP4 URL: ${foundUrl}`);
      }
    });

    try {
      debugLog("[DEBUG] Navigating to embed URL...");
      await page.goto(updatedEmbedUrl, { waitUntil: "networkidle", timeout: navigationTimeout });
      debugLog("[DEBUG] Navigation successful");
    } catch (error) {
      console.error("[ERROR] Navigation error:", error.message);
      return res.status(400).json({ error: "Invalid parent parameter or embed URL" });
    }

    const waitTimeout = 120000; // Maximum time to wait for the MP4 URL (15 seconds)
    const startTime = Date.now();

    while (!foundUrl) {
      if (Date.now() - startTime > waitTimeout) {
        console.error("[ERROR] Timeout waiting for MP4 URL");
        return res.status(404).json({ error: "Timeout waiting for MP4 URL" });
      }
      //debugLog("[DEBUG] Waiting for MP4 URL...");
      await new Promise((resolve) => setTimeout(resolve, navigationTimeout));
    }

    debugLog("[DEBUG] Browser closing...");
    await page.close();
    await browser.close();

    if (foundUrl) {
      if (webplayer) {
        debugLog("[DEBUG] Rendering video player with MP4 URL");
        return res.render("video-player", { videoSrc: foundUrl });
      } else {
        debugLog("[DEBUG] Returning MP4 URL as JSON");
        return res.json({ mp4Url: foundUrl });
      }
    } else {
      console.error("[ERROR] No .mp4 URL found");
      return res.status(404).json({ error: "No .mp4 URL found" });
    }
  } catch (error) {
    console.error("[ERROR] Error executing Playwright script:", error.message);
    return res.status(500).json({ error: "Error executing Playwright script" });
  } finally {
    if (browser) {
      debugLog("[DEBUG] Ensuring browser is closed");
      await browser.close();
    }
  }
});

export default router;