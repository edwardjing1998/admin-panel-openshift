"use strict";

// Server-only bridge. Never expose EDITOR_API_KEY to the browser.
// Pilot allows ONLY explicitly approved video job IDs. This route is not
// user-authenticated: protect it with SSO before enabling member-specific videos.
const http = require("node:http");
const https = require("node:https");
const fs = require("node:fs");
const path = require("node:path");
const deployedCatalog = path.join(__dirname, "video-preview-jobs.json");
const localCatalog = path.join(__dirname, "../src/config/videoPreviewJobs.json");
const videoPreviewJobs = require(
  fs.existsSync(deployedCatalog) ? deployedCatalog : localCatalog
);

const HOST = "127.0.0.1";
const PORT = 8081;
const VIDEO_API_BASE = process.env.MATH_VIDEO_API_BASE ||
  "https://elementary-math-practice-v2-edward-jing-dev.apps.rm1.0a51.p1.openshiftapps.com";
const JOB_ID_RE = /^[a-f0-9]{32}$/i;
const PATH_RE = /^\/api\/team\/videos\/([a-f0-9]{32})\/playback-url\/?$/i;

// Both the React selectors and this server allowlist come from the same catalog.
// The Dockerfile copies the catalog here from src/config/videoPreviewJobs.json.
// Keep only explicitly approved IDs; this proxy is not end-user authenticated.
const APPROVED_VIDEO_JOBS = new Set();

if (!videoPreviewJobs || !Array.isArray(videoPreviewJobs.parents)) {
  throw new Error("Invalid video preview catalog: parents must be an array");
}

for (const parent of videoPreviewJobs.parents) {
  if (!JOB_ID_RE.test(parent.jobId)) {
    throw new Error("Invalid parent video job ID");
  }

  APPROVED_VIDEO_JOBS.add(parent.jobId.toLowerCase());

  if (!Array.isArray(parent.tabs)) {
    throw new Error("Invalid tab video catalog");
  }

  for (const tab of parent.tabs) {
    if (!JOB_ID_RE.test(tab.jobId)) {
      throw new Error("Invalid tab video job ID");
    }

    APPROVED_VIDEO_JOBS.add(tab.jobId.toLowerCase());
  }
}

async function isApprovedVideoJob(jobId) {
  return APPROVED_VIDEO_JOBS.has(jobId.toLowerCase());
}

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

if (!process.env.EDITOR_API_KEY || APPROVED_VIDEO_JOBS.size === 0) {
  console.error("Missing EDITOR_API_KEY or approved video-job allowlist");
  process.exit(1);
}

http.createServer(async (req, res) => {
  if (req.method !== "GET") {
    respond(res, 405, {error: "Method not allowed"});
    return;
  }
  const match = PATH_RE.exec((req.url || "").split("?")[0]);
  if (!match || !JOB_ID_RE.test(match[1])) {
    respond(res, 404, {error: "Not found"});
    return;
  }
  if (!(await isApprovedVideoJob(match[1]))) {
    respond(res, 404, {error: "Video not available for preview"});
    return;
  }
  fetchSignedUrl(match[1], res);
}).listen(PORT, HOST, () => {
  console.log(`Video playback proxy ready on ${HOST}:${PORT}`);
});
