# ── Build Stage ───────────────────────────────────────────────────────
# Use official Node 18 LTS Alpine image for minimal footprint
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy dependency manifests first (Docker cache optimisation)
# Reinstall only when package files change
COPY package*.json ./

# ── Production Dependencies Only ──────────────────────────────────────
# --omit=dev excludes jest, supertest (not needed at runtime)
RUN npm ci --omit=dev

# ── Copy Application Source ───────────────────────────────────────────
# .dockerignore excludes node_modules, .env, coverage, tests
COPY . .

# ── Runtime Configuration ─────────────────────────────────────────────
# Cloud Run injects PORT automatically; default to 8080
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# ── Non-root User (Security Best Practice) ────────────────────────────
# Run as node user to prevent privilege escalation
USER node

# ── Start Server ──────────────────────────────────────────────────────
CMD ["node", "index.js"]
