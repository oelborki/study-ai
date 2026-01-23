# Base image with Node.js
FROM node:20-alpine AS base
RUN apk add --no-cache python3 py3-pip

# Build the application
FROM base AS builder
WORKDIR /app

# Dummy values for build - real secrets provided at runtime via docker-compose
ENV DATABASE_URL="postgresql://build:build@localhost/build"

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install Python dependencies for PDF/PPTX extraction
COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts

# Create data directory for uploads
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
