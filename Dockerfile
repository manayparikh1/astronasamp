# ── Astronasamp — production image ───────────────────────────
FROM node:20-alpine

# Run as the built-in non-root user for safety.
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source.
COPY . .

ENV NODE_ENV=production

# Socket Mode keeps an outbound WebSocket to Slack — no inbound port needed.
USER node
CMD ["node", "index.js"]
