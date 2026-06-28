// Stress / spam test: fire many commands concurrently and confirm every call
// returns a result and none throw (simulating users spamming slash commands).
const registry = require("../src/registry");

const jobs = [
  ["weather", ["Toronto"]],
  ["weather", ["Tokyo"]],
  ["crypto", ["btc"]],
  ["crypto", ["eth"]],
  ["convert", ["100", "CAD", "USD"]],
  ["convert", ["50"]],
  ["define", ["serendipity"]],
  ["quote", []],
  ["joke", []],
  ["cat", []],
  ["help", []],
  ["ping", []]
];

const ROUNDS = 5; // 12 commands * 5 = 60 concurrent calls

(async () => {
  const tasks = [];
  let ok = 0;
  let bad = 0;
  for (let r = 0; r < ROUNDS; r++) {
    for (const [name, args] of jobs) {
      const cmd = registry.get(name);
      const ctx = {
        args, registry, userId: "U", client: {},
        respond: async (arg) => {
          const blocks = (arg && arg.blocks) || [];
          if (blocks.length === 0) throw new Error(`${name} returned empty response`);
        }
      };
      tasks.push(
        cmd.run(ctx).then(() => ok++).catch((e) => { bad++; console.log(`❌ ${name}: ${e.message}`); })
      );
    }
  }
  await Promise.all(tasks);
  console.log(`\nFired ${tasks.length} concurrent commands → ${ok} ok, ${bad} failed`);
  process.exit(bad ? 1 : 0);
})();

const successRate = (ok / tasks.length) * 100;
console.log(`Success rate: ${successRate.toFixed(2)}%`);