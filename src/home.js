// Publishes the bot's App Home tab — a dashboard users see when they open the
// bot from the sidebar. Auto-built from the same command registry as /help.
const { header, section, divider, context } = require("./lib/blocks");

function buildHomeView(registry) {
  const groups = {};
  for (const cmd of registry.unique()) {
    (groups[cmd.category] = groups[cmd.category] || []).push(cmd);
  }

  const blocks = [
    header("🛰️  Astronasamp"),
    section("*Your everyday utility bot for Slack.*\nWeather, currency, crypto, definitions, and more — one command away."),
    divider()
  ];

  for (const cat of Object.keys(groups).sort()) {
    const lines = groups[cat]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => `• \`${c.usage}\` — ${c.summary}`)
      .join("\n");
    blocks.push(section(`*${cat}*\n${lines}`));
  }

  blocks.push(divider());
  blocks.push(context("Tip: type `/astronasamp help` in any channel to see this menu inline."));

  return { type: "home", blocks };
}

async function publishHome(client, userId, registry, logger) {
  try {
    await client.views.publish({ user_id: userId, view: buildHomeView(registry) });
  } catch (err) {
    logger.warn("home publish failed", { user: userId, error: err.message });
  }
}

module.exports = { buildHomeView, publishHome };
