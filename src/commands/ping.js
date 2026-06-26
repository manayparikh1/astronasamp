const { section } = require("../lib/blocks");

module.exports = {
  name: "ping",
  category: "System",
  summary: "Health check — confirm the bot is online",
  usage: "/astronasamp ping",
  run: async ({ respond }) => {
    const uptime = Math.floor(process.uptime());
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = uptime % 60;
    await respond({
      blocks: [
        section(
          ":satellite_antenna: *Astronasamp is online.*\n" +
            `All systems nominal — uptime \`${h}h ${m}m ${s}s\`. :rocket:`
        )
      ]
    });
  }
};
