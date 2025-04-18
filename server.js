import { execSync } from "child_process";
import express from "express";
import path from "path";
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname } from "path";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Detect and install only Chromium for Playwright
try {
  console.log("Checking Playwright Chromium installation...");
  execSync("npx playwright install chromium", { stdio: "inherit" });
  console.log("Chromium is installed for Playwright.");
} catch (error) {
  console.error("Failed to install Chromium for Playwright:", error);
  process.exit(1); // Exit the process if installation fails
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Twitch Clip Player API",
      version: "1.0.0",
      description: "API documentation for Twitch Clip Player",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: [__filename], // Points to this file for API documentation
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Configura Pug como engine de template
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Route for the index page
app.get("/", (req, res) => {
  res.render("index", { apiDocsUrl: `/api-docs` });
});

// Route to handle form submission for /get-mp4
app.get("/try-get-mp4", async (req, res) => {
  const embedUrl = req.query.url;
  if (!embedUrl) {
    return res.render("index", { error: "Please provide a valid URL.", apiDocsUrl: `/api-docs` });
  }

  try {
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    let foundUrl = null;

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes(".mp4") && !foundUrl) {
        foundUrl = url;
      }
    });

    await page.goto(embedUrl, { waitUntil: "networkidle" });

    while (!foundUrl) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await page.close();
    await browser.close();

    if (foundUrl) {
      return res.render("index", { videoSrc: foundUrl, apiDocsUrl: `/api-docs` });
    } else {
      return res.render("index", { error: "No .mp4 URL found.", apiDocsUrl: `/api-docs` });
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    return res.render("index", { error: "An error occurred while processing the URL.", apiDocsUrl: `/api-docs` });
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
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         required: true
 *         description: The Twitch embed URL to extract the MP4 from.
 *         example: "https://clips.twitch.tv/embed?clip=IncredulousBigCoyotePastaThat-mlf24oYJpnTA4C-v"
 *     responses:
 *       200:
 *         description: Successfully retrieved the MP4 URL
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Missing or invalid URL parameter
 *       404:
 *         description: No .mp4 URL found
 *       500:
 *         description: Error executing Playwright script
 */
app.get("/get-mp4", async (req, res) => {
  const embedUrl = req.query.url;
  console.log(`Received request for /get-mp4 with URL: ${embedUrl}`);

  if (!embedUrl) {
    console.log("Missing URL parameter");
    return res.status(400).send("Missing URL parameter");
  }

  try {
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    let foundUrl = null;

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes(".mp4") && !foundUrl) {
        foundUrl = url;
        console.log(`.mp4 URL found: ${url}`);
      }
    });

    await page.goto(embedUrl, { waitUntil: "networkidle" });
    console.log(`Navigated to URL: ${embedUrl}`);

    while (!foundUrl) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for the mp4 URL to be detected
    }

    await page.close();
    await browser.close();
    console.log("Page closed");
    if (foundUrl) {
      res.render("video-player", { videoSrc: foundUrl });
    } else {
      res.status(404).send("No .mp4 URL found.");
    }
  } catch (error) {
    console.error(`Error executing Playwright script: ${error}`);
    res.status(500).send("Error executing Playwright script");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
});
