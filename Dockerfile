# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps (use lockfile if present)
COPY package*.json ./
RUN npm ci || npm install

# Build the static site.
# Pass a Gemini key at build time to enable live AI (optional — the app runs
# on curated cached responses without it):
#   docker build --build-arg VITE_GEMINI_API_KEY=xxxx .
ARG VITE_GEMINI_API_KEY=""
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Cloud Run injects PORT (default 8080); server.js honors it.
ENV PORT=8080
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/package.json ./package.json
EXPOSE 8080
CMD ["node", "server.js"]
