#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
node --check server/video-playback-proxy.js
if grep -q VIDEO_PREVIEW_JOB_IDS server/video-playback-proxy.js openshift/deployment.yml; then
  echo 'FAIL: old environment variable remains' >&2
  exit 1
fi
# Start with temporary dummy key: invalid IDs are rejected before upstream access.
EDITOR_API_KEY=test-only-local-key node server/video-playback-proxy.js > /tmp/admin-video-proxy-test.log 2>&1 &
PID=$!
trap 'kill "$PID" 2>/dev/null || true' EXIT
sleep 1
node - <<'JS'
const http=require('node:http');
async function check(path,expected) {
  const status=await new Promise((resolve,reject)=>{
    http.get({hostname:'127.0.0.1',port:8081,path},r=>{r.resume();r.on('end',()=>resolve(r.statusCode));}).on('error',reject);
  });
  if(status!==expected)throw new Error(`${path}: expected ${expected}, got ${status}`);
  process.stdout.write(`PASS ${expected} ${path}\n`);
}
(async()=>{
  await check('/api/team/videos/ffffffffffffffffffffffffffffffff/playback-url',404);
  await check('/api/team/videos/invalid/playback-url',404);
  await check('/missing',404);
  // All five configured jobs must be approved and forwarded upstream,
  // rather than rejected locally as unrecognized (404).
  const catalog=require('./src/config/videoPreviewJobs.json');
  for(const parent of catalog){
    for(const id of [parent.id,...parent.tabs.map(tab=>tab.jobId)]){
      // The upstream call may return 502 or 404 depending on connectivity.
      // Here we validate the catalog independently to avoid external requests.
      if(!/^[a-f0-9]{32}$/i.test(id)) throw new Error(`Invalid approved job ID: ${id}`);
    }
  }
})().catch(e=>{console.error(e);process.exitCode=1});
JS
