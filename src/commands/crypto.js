const { getJSON } = require("../lib/http");
const { header, section, fields, context } = require("../lib/blocks");

// Friendly symbol → CoinGecko id mapping for the most common coins.
const SYMBOLS = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  ada: "cardano",
  xrp: "ripple",
  doge: "dogecoin",
  bnb: "binancecoin",
  dot: "polkadot",
  matic: "matic-network",
  ltc: "litecoin"
};

module.exports = {
  name: "crypto",
  aliases: ["coin", "price"],
  category: "Finance",
  summary: "Live crypto price + 24h change",
  usage: "/astronasamp crypto <coin>",
  run: async ({ args, respond }) => {
    const input = (args[0] || "").toLowerCase();
    if (!input) {
      await respond({ blocks: [section(":coin: Usage: `/astronasamp crypto <coin>` — e.g. `crypto btc` or `crypto ethereum`")] });
      return;
    }
    const id = SYMBOLS[input] || input;

    const data = await getJSON("https://api.coingecko.com/api/v3/simple/price", {
      params: { ids: id, vs_currencies: "usd", include_24hr_change: true }
    });

    if (!data[id]) {
      await respond({
        blocks: [section(`:mag: I couldn't find *${input}*. Try a symbol (\`btc\`, \`eth\`) or full id (\`bitcoin\`).`)]
      });
      return;
    }

    const price = data[id].usd;
    const change = data[id].usd_24h_change || 0;
    const arrow = change >= 0 ? "📈" : "📉";
    const sign = change >= 0 ? "+" : "";

    await respond({
      blocks: [
        header(`${arrow}  ${id.toUpperCase()} — Live Price`),
        fields([
          `:dollar: *Price (USD)*\n$${price.toLocaleString()}`,
          `:chart_with_upwards_trend: *24h Change*\n${sign}${change.toFixed(2)}%`
        ]),
        context("Data: CoinGecko • prices are indicative, not financial advice")
      ]
    });
  }
};
