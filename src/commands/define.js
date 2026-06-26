const { getJSON } = require("../lib/http");
const { header, section, context } = require("../lib/blocks");

module.exports = {
  name: "define",
  aliases: ["dict", "word"],
  category: "Utilities",
  summary: "Dictionary definition of a word",
  usage: "/astronasamp define <word>",
  run: async ({ args, respond }) => {
    const word = (args[0] || "").trim();
    if (!word) {
      await respond({ blocks: [section(":book: Usage: `/astronasamp define <word>` — e.g. `define serendipity`")] });
      return;
    }

    let data;
    try {
      data = await getJSON(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        await respond({ blocks: [section(`:mag: No definition found for *${word}*.`)] });
        return;
      }
      throw err;
    }

    const entry = data[0];
    const phonetic = entry.phonetic ? `  _${entry.phonetic}_` : "";
    const lines = [];
    for (const meaning of entry.meanings.slice(0, 3)) {
      const def = meaning.definitions[0];
      lines.push(`*_${meaning.partOfSpeech}_*\n>${def.definition}` + (def.example ? `\n_“${def.example}”_` : ""));
    }

    await respond({
      blocks: [
        header(`📖  ${entry.word}`),
        section(`*${entry.word}*${phonetic}`),
        section(lines.join("\n\n")),
        context("Source: dictionaryapi.dev")
      ]
    });
  }
};
