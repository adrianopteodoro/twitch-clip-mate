import express from "express";
import axios from "axios";
import { chromium } from "playwright";

const router = express.Router();

// Try /get-mp4 Endpoint
router.get("/try-get-mp4", async (req, res) => {
  const embedUrl = req.query.url;

  if (!embedUrl) {
    return res.render("index", { error: "Please provide a valid URL.", apiDocsUrl: `/api-docs` });
  }

  try {
    const response = await axios.get(`${req.protocol}://${req.headers.host}/get-mp4`, {
      params: {
        url: embedUrl,
        webplayer: false,
      },
    });

    const mp4Url = response.data.mp4Url;
    return res.render("index", { videoSrc: mp4Url, apiDocsUrl: `/api-docs` });
  } catch (error) {
    const errorMessage =
      error.response && error.response.data ? error.response.data : "An error occurred while processing the URL.";
    return res.render("index", { error: errorMessage, apiDocsUrl: `/api-docs` });
  }
});

// Get MP4 Endpoint
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