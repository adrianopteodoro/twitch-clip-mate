import express from "express";
import axios from "axios";
import { chromium } from "playwright";

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
  let embedUrl = req.query.url;
  const webplayer = req.query.webplayer === "true";

  if (!embedUrl) {
    return res.status(400).send("Missing URL parameter");
  }

  const appHost = req.hostname;
  const parentParam = `&parent=${appHost}`;
  embedUrl = embedUrl.includes("&parent=")
    ? embedUrl.replace(/&parent=[^&]*/, parentParam)
    : embedUrl + parentParam;

  try {
    const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    let foundUrl = null;

    const navigationTimeout = 10000;
    let navigationError = false;

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes(".mp4") && !foundUrl) {
        foundUrl = url;
      }
    });

    try {
      await page.goto(embedUrl, { waitUntil: "networkidle", timeout: navigationTimeout });
    } catch {
      navigationError = true;
    }

    if (navigationError) {
      await page.close();
      await browser.close();
      return res.status(400).send("Invalid parent parameter or embed URL.");
    }

    while (!foundUrl) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await page.close();
    await browser.close();

    if (foundUrl) {
      if (webplayer) {
        return res.render("video-player", { videoSrc: foundUrl });
      } else {
        return res.json({ mp4Url: foundUrl });
      }
    } else {
      return res.status(404).send("No .mp4 URL found.");
    }
  } catch (error) {
    res.status(500).send("Error executing Playwright script");
  }
});

export default router;