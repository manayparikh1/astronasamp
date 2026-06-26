const { getJSON } = require("../lib/http");
const { header, section, context } = require("../lib/blocks");

module.exports = {
  name: "convert",
  aliases: ["fx", "currency"],
  category: "Utilities",
  summary: "Convert money between currencies (live ECB rates)",
  usage: "/astronasamp convert <amount> [FROM] [TO]",
  run: async ({ args, respond }) => {
    const [amountRaw, fromRaw, toRaw] = args;
    const amount = Number(amountRaw);
    // Default to Canadian dollars → US dollars when currencies are omitted.
    const from = (fromRaw || "CAD").toUpperCase();
    const to = (toRaw || "USD").toUpperCase();

    if (!amountRaw || Number.isNaN(amount)) {
      await respond({
        blocks: [section(":money_with_wings: Usage: `/astronasamp convert <amount> [FROM] [TO]` — e.g. `convert 100 CAD USD` (defaults to CAD → USD)")]
      });
      return;
    }

    const data = await getJSON("https://api.frankfurter.dev/v1/latest", {
      params: { amount, base: from, symbols: to }
    });

    if (!data.rates || data.rates[to] === undefined) {
      await respond({
        blocks: [section(`:warning: I can't convert *${from} → ${to}*. Use ISO codes like USD, EUR, GBP, JPY, CAD.`)]
      });
      return;
    }

    const result = data.rates[to];
    const unitRate = result / amount;
    await respond({
      blocks: [
        header("💱  Currency Conversion"),
        section(`*${amount.toLocaleString()} ${from}*  =  *${result.toLocaleString()} ${to}*`),
        context(`Rate: 1 ${from} = ${unitRate.toFixed(4)} ${to} • ECB reference rates (${data.date})`)
      ]
    });
  }
};
