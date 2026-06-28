// Shared HTTP client: sane timeout, identifying UA, and light retry with
// backoff so a single flaky upstream response doesn't surface to the user.
const axios = require("axios");
const logger = require("./logger");

const client = axios.create({
  timeout: Number(process.env.HTTP_TIMEOUT_MS) || 8000,
  headers: { "User-Agent": "astronasamp-slack-bot/2.0 (+https://slack.com)" }
});

async function getJSON(url, { retries = 3, params } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await client.get(url, { params });
      return res.data;
    } catch (err) {
      lastErr = err;
      const status = err.response && err.response.status;
      // Retry transient failures: network errors, 5xx, and 429 (rate limit).
      // Don't retry deterministic client errors like 400/404.
      const retryable = !status || status >= 500 || status === 429;
      if (!retryable) break;
      if (attempt < retries) {
        // Respect Retry-After if the server sent one; else exponential backoff.
        const retryAfter = Number(err.response && err.response.headers["retry-after"]) * 1000;
        const wait = retryAfter || 400 * Math.pow(2, attempt);
        logger.warn("http retry", { url, status: status || "network", attempt: attempt + 1, wait });
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

module.exports = { getJSON, client };
