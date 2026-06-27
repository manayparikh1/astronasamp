const { getJSON } = require("../lib/http");
const { section } = require("../lib/blocks");

module.exports = {
  name: "joke",
  category: "Fun",
  summary: "A random joke",
  usage: "/astronasamp joke",
  run: async ({ respond }) => {
    const data = await getJSON("https://official-joke-api.appspot.com/random_joke");
    await respond({
      blocks: [section(`:laughing:  *${data.setup}*\n\n_${data.punchline}_`)]
    });
  }
};
