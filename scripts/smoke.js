// Offline smoke test: exercises every command's run() with a mock Slack
// context and real upstream APIs. No Slack connection required.
//   node scripts/smoke.js
const registry = require("../src/registry");

const cases = [
  ["help", []],
  ["ping", []],
  ["weather", ["Tokyo"]],
  ["convert", ["100", "CAD", "USD"]],
  ["convert", ["50"]], // default CAD → USD
  ["crypto", ["btc"]],
  ["define", ["serendipity"]],
  ["quote", []],
  ["joke", []],
  ["cat", []],
  ["poll", ["Best language?", "|", "JavaScript", "|", "Python"]],
  ["poll", ["missing options"]], // usage-guard path
  ["weather", []], // usage-guard path
  ["crypto", ["notacoin"]] // not-found path
];

function preview(arg) {
  const blocks = arg.blocks || [];
  const txt = blocks
    .map((b) => (b.text && b.text.text) || (b.fields && b.fields.map((f) => f.text).join(" | ")) || "")
    .join(" ⏎ ")
    .replace(/\s+/g, " ")
    .slice(0, 160);
  return txt;
}

(async () => {
  let pass = 0;
  let fail = 0;
  for (const [name, args] of cases) {
    const cmd = registry.get(name);
    const ctx = {
      args,
      registry,
      userId: "U_TEST",
      client: {},
      respond: async (arg) => {
        console.log(`✅ ${name} ${args.join(" ")} → ${preview(arg)}`);
      }
    };
    try {
      await cmd.run(ctx);
      pass++;
    } catch (err) {
      fail++;
      console.log(`❌ ${name} ${args.join(" ")} → ERROR ${err.message}`);
    }
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
