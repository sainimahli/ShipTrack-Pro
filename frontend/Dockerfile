# ─────────────────────────────────────────────────────────────────────────────
# ShipTrack-Pro — Frontend Dockerfile
# Multi-stage: Vite build → nginx static file server
# ─────────────────────────────────────────────────────────────────────────────

# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --silent
COPY . .
# VITE_API_URL is injected at build time via --build-arg
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# SPA routing: all paths fall back to index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
