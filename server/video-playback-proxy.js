"use strict";

// Server-only bridge. Never expose EDITOR_API_KEY to the browser.
// Pilot allows ONLY explicitly allowlisted video job IDs. This route is not
// user-authenticated: protect it with SSO before enabling member-specific videos.
const http = require("node:http");
const https = require("node:https");

const HOST = "127.0.0.1";
const PORT = 8081;
const VIDEO_API_BASE = process.env.MATH_VIDEO_API_BASE ||
  "https://elementary-math-practice-v2-edward-jing-dev.apps.rm1.0a51.p1.openshiftapps.com";
const JOB_ID_RE = /^[a-f0-9]{32}$/i;
const PATH_RE = /^\/api\/team\/videos\/([a-f0-9]{32})\/playback-url\/?$/i;

// Fail closed unless a server-configured list of video IDs is present.
const ALLOWED_JOB_IDS = new Set(
  (process.env.VIDEO_PREVIEW_JOB_IDS || "")
    .split(",")
    .map((id) => id.trim().toLowerCase())
    .filter((id) => JOB_ID_RE.test(id))
);

function respond(res, status, data, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, private",
    "Pragma": "no-cache",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  res.end(JSON.stringify(data));
}

function fetchSignedUrl(jobId, res) {
  const upstream = new URL(`/api/v1/videos/${jobId}/playback-url`, VIDEO_API_BASE);
  if (upstream.protocol !== "https:") {
    respond(res, 502, {error: "Video service must use HTTPS"});
    return;
  }
  const req = https.get(upstream, {
    headers: {"x-editor-key": process.env.EDITOR_API_KEY, "Accept": "application/json"},
    timeout: 10000,
  }, (upstreamRes) => {
    let body = "";
    upstreamRes.setEncoding("utf8");
    upstreamRes.on("data", (chunk) => {
      body += chunk;
      if (body.length > 65536) upstreamRes.destroy();
    });
    upstreamRes.on("end", () => {
      if (upstreamRes.statusCode !== 200) {
        respond(res, upstreamRes.statusCode === 404 ? 404 : 502,
          {error: "Unable to authorize video playback"});
        return;
      }
      try {
        const result = JSON.parse(body);
        const url = new URL(result.playback_url);
        if (url.protocol !== "https:" ||
            !url.hostname.endsWith(".blob.core.windows.net") ||
            !url.searchParams.has("sig")) throw new Error("Invalid playback URL");
        respond(res, 200, {
          job_id: jobId,
          playback_url: result.playback_url,
          expires_at: result.expires_at,
          expires_in_seconds: result.expires_in_seconds,
          content_type: "video/mp4",
        });
      } catch (_) {
        respond(res, 502, {error: "Invalid response from video service"});
      }
    });
  });
  req.on("timeout", () => req.destroy(new Error("Upstream timeout")));
  req.on("error", () => {
    if (!res.headersSent) respond(res, 502, {error: "Video service unavailable"});
  });
}

if (!process.env.EDITOR_API_KEY || ALLOWED_JOB_IDS.size === 0) {
  console.error("Missing EDITOR_API_KEY or VIDEO_PREVIEW_JOB_IDS allowlist");
  process.exit(1);
}

http.createServer((req, res) => {
  if (req.method !== "GET") {
    respond(res, 405, {error: "Method not allowed"});
    return;
  }
  const match = PATH_RE.exec((req.url || "").split("?")[0]);
  if (!match || !JOB_ID_RE.test(match[1])) {
    respond(res, 404, {error: "Not found"});
    return;
  }
  if (!ALLOWED_JOB_IDS.has(match[1].toLowerCase())) {
    respond(res, 404, {error: "Video not available for preview"});
    return;
  }
  fetchSignedUrl(match[1], res);
}).listen(PORT, HOST, () => {
  console.log(`Video playback proxy ready on ${HOST}:${PORT}`);
});
