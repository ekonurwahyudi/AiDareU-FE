# Frontend (Next.js)
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build:icons && npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# Jika menggunakan next.config.js/ts, copy juga jika diperlukan
COPY --from=builder /app/next.config.* ./
EXPOSE 3000
CMD ["npm", "run", "start"]