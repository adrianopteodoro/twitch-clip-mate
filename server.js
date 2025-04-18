import { execSync } from "child_process";
import express from "express";
import path from "path";
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname } from "path";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import axios from "axios";

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 3000;

// Install Chromium for Playwright
try {
  console.log("Checking Playwright Chromium installation...");
  execSync("npx playwright install chromium", { stdio: "inherit" });
  console.log("Chromium is installed for Playwright.");
} catch (error) {
  console.error("Failed to install Chromium for Playwright:", error);
  process.exit(1);
}

// Initialize Express
const app = express();

// Swagger Configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Twitch Clip Player API",
      version: "1.0.0",
      description: "API documentation for Twitch Clip Player",
    },
  },
  apis: [__filename],
};

// Middleware to dynamically set Swagger servers
app.use((req, res, next) => {
  swaggerOptions.swaggerDefinition.servers = [
    {
      url: `${req.protocol}://${req.hostname}`,
    },
  ];
  next();
});

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Configure Pug as the template engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Routes

// Index Page
app.get("/", (req, res) => {
  res.render("index", { apiDocsUrl: `/api-docs` });
});

// Try /get-mp4 Endpoint
app.get("/try-get-mp4", async (req, res) => {
  const embedUrl = req.query.url;

  if (!embedUrl) {
    return res.render("index", { error: "Please provide a valid URL.", apiDocsUrl: `/api-docs` });
  }

  try {
    // Call the /get-mp4 endpoint with webplayer=false to get the MP4 URL
    const response = await axios.get(`${req.protocol}://${req.headers.host}/get-mp4`, {
      params: {
        url: embedUrl,
        webplayer: false,
      },
    });

    const mp4Url = response.data.mp4Url;

    // Render the video player with the retrieved MP4 URL
    return res.render("index", { videoSrc: mp4Url, apiDocsUrl: `/api-docs` });
  } catch (error) {
    console.error(`Error fetching MP4 URL: ${error.message}`);
    const errorMessage =
      error.response && error.response.data ? error.response.data : "An error occurred while processing the URL.";
    return res.render("index", { error: errorMessage, apiDocsUrl: `/api-docs` });
  }
});

/**
 * @swagger
 * /get-mp4:
 *   get:
 *     summary: Retrieve an MP4 URL from an embed URL
 *     description: |
 *       This endpoint extracts the MP4 URL from a Twitch embed URL. 
 *       To use this endpoint, provide a valid Twitch embed URL in the `url` query parameter.
 *       
 *       ### How to Get an Embed URL:
 *       1. Find the embed code for the Twitch clip, which looks like this:
 *          ```html
 *          <iframe src="https://clips.twitch.tv/embed?clip=IncredulousBigCoyotePastaThat-mlf24oYJpnTA4C-v&parent=www.example.com" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="620"></iframe>
 *          ```
 *       2. Copy the value inside the `src` attribute:
 *          ```
 *          https://clips.twitch.tv/embed?clip=IncredulousBigCoyotePastaThat-mlf24oYJpnTA4C-v&parent=www.example.com
 *          ```
 *       3. Remove the `&parent` parameter if it exists (optional):
 *          ```
 *          https://clips.twitch.tv/embed?clip=IncredulousBigCoyotePastaThat-mlf24oYJpnTA4C-v
 *          ```
 *       4. Use the extracted URL as the `url` query parameter.
 *       
 *       ### Webplayer Flag:
 *       - If `webplayer` is set to `true`, the endpoint renders a web player using a Pug template.
 *       - If `webplayer` is omitted or set to `false`, the endpoint returns a JSON response with the MP4 URL.
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         required: true
 *         description: The Twitch embed URL to extract the MP4 from.
 *         example: "https://clips.twitch.tv/embed?clip=IncredulousBigCoyotePastaThat-mlf24oYJpnTA4C-v"
 *       - in: query
 *         name: webplayer
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Flag to determine the response type. If `true`, renders a web player. Defaults to `false`.
 *         example: true
 *     responses:
 *       200:
 *         description: Successfully retrieved the MP4 URL
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: HTML content for the web player (if `webplayer` is `true`).
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mp4Url:
 *                   type: string
 *                   description: The extracted MP4 URL.
 *                   example: "https://example.com/path/to/clip.mp4"
 *       400:
 *         description: Missing or invalid URL parameter
 *       404:
 *         description: No .mp4 URL found
 *       500:
 *         description: Error executing Playwright script
 */
app.get("/get-mp4", async (req, res) => {
  let embedUrl = req.query.url;
  const webplayer = req.query.webplayer === "true";
  console.log(`Received request for /get-mp4 with URL: ${embedUrl}, webplayer: ${webplayer}`);

  if (!embedUrl) {
    return res.status(400).send("Missing URL parameter");
  }

  // Auto-add or replace the `parent` parameter
  const appHost = req.hostname;
  const parentParam = `&parent=${appHost}`;
  embedUrl = embedUrl.includes("&parent=")
    ? embedUrl.replace(/&parent=[^&]*/, parentParam)
    : embedUrl + parentParam;

  console.log(`Updated embed URL with parent: ${embedUrl}`);

  try {
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    let foundUrl = null;

    // Add a timeout to detect invalid `parent` parameter
    const navigationTimeout = 10000;
    let navigationError = false;

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes(".mp4") && !foundUrl) {
        foundUrl = url;
        console.log(`.mp4 URL found: ${url}`);
      }
    });

    try {
      await page.goto(embedUrl, { waitUntil: "networkidle", timeout: navigationTimeout });
      console.log(`Navigated to URL: ${embedUrl}`);
    } catch (error) {
      console.error(`Navigation error: ${error.message}`);
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
    console.error(`Error executing Playwright script: ${error}`);
    res.status(500).send("Error executing Playwright script");
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
});
