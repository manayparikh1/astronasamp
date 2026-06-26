const { header, section, divider, context } = require("../lib/blocks");

module.exports = {
  name: "help",
  aliases: ["", "menu", "commands"],
  category: "System",
  summary: "Show the full command directory",
  usage: "/astronasamp help",
  run: async ({ respond, registry }) => {
    // Group commands by category for a clean, scannable menu.
    const groups = {};
    for (const cmd of registry.unique()) {
      (groups[cmd.category] = groups[cmd.category] || []).push(cmd);
    }

    const blocks = [
      header("🛰️  Astronasamp — Command Center"),
      section(
        "Your everyday utility bot. Run any command as " +
          "`/astronasamp <command> [arguments]`."
      ),
      divider()
    ];

    for (const cat of Object.keys(groups).sort()) {
      const lines = groups[cat]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => `• \`${c.usage}\`\n     ${c.summary}`)
        .join("\n");
      blocks.push(section(`*${cat}*\n${lines}`));
    }

    blocks.push(divider());
    blocks.push(
      context("Astronasamp v2 • multi-API utility bot • built with Slack Bolt :sparkles:")
    );

    await respond({ blocks });
  }
};
