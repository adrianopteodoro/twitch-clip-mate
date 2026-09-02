import express from "express";
import debugLog from "../utils/debugLog.js";
import { extractClipSlug, resolveClipMp4Url, ClipResolutionError } from "../utils/twitchClip.js";

const router = express.Router();

/**
 * @swagger
 * /get-mp4:
 *   get:
 *     summary: Get an MP4 URL from an embed URL.
 *     description: This endpoint resolves an MP4 URL from the provided Twitch clip URL via Twitch's GraphQL API.
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         required: true
 *         description: The Twitch clip or embed URL to process.
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
 *         description: Clip not found or has no playable MP4.
 *       502:
 *         description: Error querying Twitch's API.
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

  let slug;
  try {
    slug = extractClipSlug(embedUrl);
  } catch (error) {
    console.error("[ERROR] Invalid embed URL:", error.message);
    return res.status(400).json({ error: "Invalid embed URL" });
  }

  if (!slug) {
    console.error("[ERROR] Could not find a clip slug in the provided URL");
    return res.status(400).json({ error: "Could not find a clip slug in the provided URL" });
  }

  debugLog(`[DEBUG] Extracted clip slug: ${slug}`);

  let mp4Url;
  try {
    mp4Url = await resolveClipMp4Url(slug);
    debugLog(`[DEBUG] Resolved MP4 URL: ${mp4Url}`);
  } catch (error) {
    console.error("[ERROR] Failed to resolve MP4 URL from Twitch:", error.message);
    const status = error instanceof ClipResolutionError ? error.status : 502;
    return res.status(status).json({ error: "Failed to resolve MP4 URL from Twitch", details: error.message });
  }

  if (webplayer) {
    debugLog("[DEBUG] Rendering video player with MP4 URL");
    return res.render("video-player", { videoSrc: mp4Url });
  }

  debugLog("[DEBUG] Returning MP4 URL as JSON");
  return res.json({ mp4Url });
});

export default router;
