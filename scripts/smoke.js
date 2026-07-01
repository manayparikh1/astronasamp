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

// Exercises the vote button (onAction), including recovery after a restart
// wiped the in-memory store. Returns [pass, fail] and logs each check.
async function votePathChecks() {
  const poll = registry.get("poll");
  let pass = 0;
  let fail = 0;

  const check = (label, ok) => {
    if (ok) {
      pass++;
      console.log(`✅ vote ${label}`);
    } else {
      fail++;
      console.log(`❌ vote ${label}`);
    }
  };

  // Create a poll and capture the posted message blocks.
  let posted;
  await poll.run({
    args: ["Tabs or spaces?", "|", "Tabs", "|", "Spaces"],
    respond: async (arg) => { posted = arg; }
  });
  const actions = posted.blocks.find((b) => b.type === "actions");
  const [id] = actions.elements[0].value.split(":");

  // A normal click updates the message in place via respond(replace_original).
  let updated;
  await poll.onAction({
    ack: async () => {},
    body: { user: { id: "U1" }, message: { blocks: posted.blocks } },
    action: { value: `${id}:0` },
    respond: async (arg) => { updated = arg; }
  });
  const txt1 = JSON.stringify(updated.blocks);
  check("click updates the poll in place", updated.replace_original === true && txt1.includes("1 vote"));

  // Simulate a restart: vote on a poll id the store has never seen, using a
  // message we forged with a fresh id. It should rebuild and still count.
  const freshId = "zztest";
  const rebuiltBlocks = posted.blocks.map((b) =>
    b.type === "actions"
      ? { ...b, elements: b.elements.map((e, i) => ({ ...e, value: `${freshId}:${i}` })) }
      : b
  );
  let recovered;
  await poll.onAction({
    ack: async () => {},
    body: { user: { id: "U2" }, message: { blocks: rebuiltBlocks } },
    action: { value: `${freshId}:1` },
    respond: async (arg) => { recovered = arg; }
  });
  const txt2 = JSON.stringify(recovered.blocks);
  check("survives a restart and still records the vote", recovered.replace_original === true && txt2.includes("1 vote"));

  return [pass, fail];
}

(async () => {
  const start = Date.now();
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
  const [votePass, voteFail] = await votePathChecks();
  pass += votePass;
  fail += voteFail;
  const total = cases.length + votePass + voteFail;

  const duration = Date.now() - start;
  console.log("\n=== Test report ===");
  console.log(`Total tests:  ${total}`);
  console.log(`Passed:       ${pass}`);
  console.log(`Failed:       ${fail}`);
  console.log(`Success rate: ${((pass / total) * 100).toFixed(2)}%`);
  console.log(`Total runtime: ${duration}ms`);
  console.log("===================\n");
  process.exit(fail ? 1 : 0);
})();