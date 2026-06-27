const { getJSON } = require("../lib/http");
const { section, context } = require("../lib/blocks");

module.exports = {
  name: "quote",
  aliases: ["inspire"],
  category: "Fun",
  summary: "An inspirational quote",
  usage: "/astronasamp quote",
  run: async ({ respond }) => {
    const data = await getJSON("https://zenquotes.io/api/random");
    const q = data[0];
    await respond({
      blocks: [
        section(`:sparkles: >${q.q}`),
        context(`— *${q.a}*`)
      ]
    });
  }
};
