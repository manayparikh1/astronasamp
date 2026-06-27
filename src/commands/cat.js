const { getJSON } = require("../lib/http");
const { section } = require("../lib/blocks");

module.exports = {
  name: "cat",
  aliases: ["catfact"],
  category: "Fun",
  summary: "A delightful random cat fact",
  usage: "/astronasamp cat",
  run: async ({ respond }) => {
    const data = await getJSON("https://catfact.ninja/fact");
    await respond({
      blocks: [section(`:cat:  *Did you know?*\n>${data.fact}`)]
    });
  }
};
