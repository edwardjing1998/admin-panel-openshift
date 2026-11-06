# syntax=docker/dockerfile:1

FROM node:20-alpine AS build

ENV NODE_OPTIONS="--max-old-space-size=1536" \
    GENERATE_SOURCEMAP=false

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY public ./public
COPY src ./src

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine

USER root
RUN apk add --no-cache nodejs
USER 101

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY server /opt/admin-video-proxy
COPY src/config/videoPreviewJobs.json /opt/admin-video-proxy/video-preview-jobs.json
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s \
  --timeout=3s \
  --start-period=10s \
  --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1

CMD ["sh", "-c", "node /opt/admin-video-proxy/video-playback-proxy.js & exec nginx -g 'daemon off;'"]