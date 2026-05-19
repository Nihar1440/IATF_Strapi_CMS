# Production-ready Dockerfile for Strapi v5 on Railway (Monorepo context)

# 1. Build stage
FROM node:20-slim AS build

# Install build dependencies for native modules (sharp, better-sqlite3, pg, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    autoconf \
    automake \
    libpng-dev \
    libvips-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json and lockfile from apps/cms
COPY apps/cms/package.json apps/cms/package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of apps/cms
COPY apps/cms/ ./

# Clean cache and build cleanly to prevent local Vite cache corruption
RUN rm -rf .cache build dist .strapi

# Set Vite memory limit to prevent build OOM on Railway builders
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# 2. Production stage
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app ./

ENV NODE_ENV=production
EXPOSE 1337
CMD ["npm", "run", "start"]
