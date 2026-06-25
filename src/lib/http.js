// Shared HTTP client: sane timeout, identifying UA, and light retry with
// backoff so a single flaky upstream response doesn't surface to the user.
const axios = require("axios");
const logger = require("./logger");

const client = axios.create({
  timeout: Number(process.env.HTTP_TIMEOUT_MS) || 8000,
  headers: { "User-Agent": "astronasamp-slack-bot/2.0 (+https://slack.com)" }
});

async function getJSON(url, { retries = 2, params } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await client.get(url, { params });
      return res.data;
    } catch (err) {
      lastErr = err;
      const status = err.response && err.response.status;
      // Don't retry deterministic client errors (404/400) — only transient ones.
      if (status && status >= 400 && status < 500) break;
      if (attempt < retries) {
        const wait = 300 * Math.pow(2, attempt);
        logger.warn("http retry", { url, attempt: attempt + 1, wait });
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

module.exports = { getJSON, client };
