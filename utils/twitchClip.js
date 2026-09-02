import debugLog from "./debugLog.js";

export class ClipResolutionError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ClipResolutionError";
    this.status = status;
  }
}

const GQL_ENDPOINT = "https://gql.twitch.tv/gql";
// Public client ID used by the Twitch web player itself (visible in every
// twitch.tv page load, not a secret). Required by gql.twitch.tv to accept
// unauthenticated requests.
const GQL_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";

const ACCESS_TOKEN_QUERY = `
  query VideoAccessToken_Clip($slug: ID!) {
    clip(slug: $slug) {
      broadcaster { login }
      playbackAccessToken(params: { platform: "web", playerBackend: "mediaplayer", playerType: "embed" }) {
        signature
        value
      }
      videoQualities {
        frameRate
        quality
        sourceURL
      }
    }
  }
`;

/**
 * Extracts a clip slug from any of the URL shapes Twitch hands out for a
 * clip (embed iframe src, player.twitch.tv, clips.twitch.tv, or a
 * twitch.tv/<channel>/clip/<slug> page URL).
 */
export function extractClipSlug(rawUrl) {
  const parsed = new URL(rawUrl);

  const clipParam = parsed.searchParams.get("clip");
  if (clipParam) {
    return clipParam;
  }

  const pathSegments = parsed.pathname.split("/").filter(Boolean);
  const clipIndex = pathSegments.indexOf("clip");
  if (clipIndex !== -1 && pathSegments[clipIndex + 1]) {
    return pathSegments[clipIndex + 1];
  }

  if (parsed.hostname === "clips.twitch.tv" && pathSegments.length > 0) {
    return pathSegments[pathSegments.length - 1];
  }

  return null;
}

/**
 * Resolves a Twitch clip slug directly to a playable MP4 URL via the same
 * GraphQL API the Twitch web player uses, with no browser involved.
 */
export async function resolveClipMp4Url(slug) {
  let response;
  try {
    response = await fetch(GQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Id": GQL_CLIENT_ID,
      },
      body: JSON.stringify({
        query: ACCESS_TOKEN_QUERY,
        variables: { slug },
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    throw new ClipResolutionError(`Failed to reach Twitch's GQL API: ${error.message}`, 502);
  }

  if (!response.ok) {
    throw new ClipResolutionError(`Twitch GQL request failed with status ${response.status}`, 502);
  }

  const payload = await response.json();
  debugLog(`[DEBUG] GQL response: ${JSON.stringify(payload)}`);

  if (payload.errors?.length) {
    throw new ClipResolutionError(`Twitch GQL returned errors: ${payload.errors.map((e) => e.message).join("; ")}`, 502);
  }

  const clip = payload.data?.clip;
  if (!clip || !clip.playbackAccessToken || !clip.videoQualities?.length) {
    throw new ClipResolutionError("Clip not found or has no playable video qualities", 404);
  }

  const { signature, value: token } = clip.playbackAccessToken;

  const bestQuality = [...clip.videoQualities].sort((a, b) => {
    const qualityDiff = parseInt(b.quality, 10) - parseInt(a.quality, 10);
    return qualityDiff !== 0 ? qualityDiff : b.frameRate - a.frameRate;
  })[0];

  const mp4Url = new URL(bestQuality.sourceURL);
  mp4Url.searchParams.set("sig", signature);
  mp4Url.searchParams.set("token", token);

  return mp4Url.toString();
}
