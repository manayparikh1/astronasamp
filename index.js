require("dotenv").config();
const express = require("express");
const { App } = require("@slack/bolt");
const logger = require("./src/lib/logger");
const registry = require("./src/registry");
const { errorCard } = require("./src/lib/blocks");
const { publishHome } = require("./src/home");

// ──────────────────────────────────────────────
//  1. Validate environment up front (fail fast)
// ──────────────────────────────────────────────
const required = ["SLACK_BOT_TOKEN", "SLACK_APP_TOKEN"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  logger.error(`Missing required env vars: ${missing.join(", ")}. See .env.example.`);
  process.exit(1);
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

// ──────────────────────────────────────────────
//  2. Single error boundary for every command
// ──────────────────────────────────────────────
async function execute(cmd, ctx) {
  const start = Date.now();
  try {
    await cmd.run(ctx);
    logger.info("command ok", { command: cmd.name, ms: Date.now() - start });
  } catch (err) {
    logger.error("command failed", { command: cmd.name, error: err.message });
    await ctx.respond(
      errorCard("Something went wrong handling that command. Please try again shortly.")
    );
  }
}

// ──────────────────────────────────────────────
//  3. Primary interface: one namespaced command
//     /astronasamp <subcommand> [args...]
// ──────────────────────────────────────────────
app.command("/astronasamp", async ({ command, ack, respond, client }) => {
  await ack();
  const text = (command.text || "").trim();
  const [sub, ...rest] = text.length ? text.split(/\s+/) : [""];
  const cmd = registry.get(sub) || registry.get("help");
  await execute(cmd, { args: rest, respond, client, registry, userId: command.user_id });
});

// ──────────────────────────────────────────────
//  4. Backwards-compatible individual commands
//     (/astronasamp-ping, -help, -cat, -joke …)
//     so anything already registered in Slack keeps working.
// ──────────────────────────────────────────────
for (const cmd of registry.unique()) {
  app.command(`/astronasamp-${cmd.name}`, async ({ command, ack, respond, client }) => {
    await ack();
    const rest = (command.text || "").trim().split(/\s+/).filter(Boolean);
    await execute(cmd, { args: rest, respond, client, registry, userId: command.user_id });
  });
}

// ──────────────────────────────────────────────
//  4b. Interactive components (buttons, etc.)
//      Commands may expose { actionPattern, onAction }.
// ──────────────────────────────────────────────
for (const cmd of registry.unique()) {
  if (cmd.actionPattern && typeof cmd.onAction === "function") {
    app.action(cmd.actionPattern, async (ctx) => {
      try {
        await cmd.onAction(ctx);
      } catch (err) {
        logger.error("action failed", { command: cmd.name, error: err.message });
        try { await ctx.ack(); } catch (e) { /* already acked */ }
      }
    });
  }
}

// ──────────────────────────────────────────────
//  5. App Home dashboard
// ──────────────────────────────────────────────
app.event("app_home_opened", async ({ event, client }) => {
  await publishHome(client, event.user, registry, logger);
});

// ──────────────────────────────────────────────
//  6. Launch + graceful shutdown
// ──────────────────────────────────────────────
(async () => {
  await app.start();
  logger.info("astronasamp is running!", { commands: registry.unique().length });
  console.log("astronasamp is running!");
})();

// ──────────────────────────────────────────────
//  6b. Tiny HTTP keep-alive server.
//      Socket Mode needs no inbound port, but many hosts
//      expect an open PORT to consider the service healthy,
//      and uptime pingers can hit "/" to keep it awake.
// ──────────────────────────────────────────────
const web = express();
web.get("/", (req, res) => res.send("Bot is running"));
web.get("/healthz", (req, res) => res.json({ status: "ok", commands: registry.unique().length }));
web.listen(process.env.PORT || 3000, () => {
  logger.info("keep-alive server listening", { port: process.env.PORT || 3000 });
  console.log("Server running on port", process.env.PORT || 3000);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, async () => {
    logger.info(`received ${sig}, shutting down gracefully`);
    try {
      await app.stop();
    } catch (e) {
      /* ignore */
    }
    process.exit(0);
  });
}

process.on("unhandledRejection", (reason) => {
  logger.error("unhandledRejection", { reason: String(reason) });
});
