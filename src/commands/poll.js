const { createPoll, restorePoll, getPoll, toggleVote } = require("../lib/pollStore");
const { header, section, context } = require("../lib/blocks");

// Rebuild a poll's definition (question + option labels) straight from the
// message that holds the buttons. Lets voting survive a restart/redeploy that
// cleared the in-memory store instead of dead-ending on "no longer active".
function pollFromMessage(message) {
  if (!message || !Array.isArray(message.blocks)) return null;
  const head = message.blocks.find((b) => b.type === "header");
  const actions = message.blocks.find((b) => b.type === "actions");
  if (!head || !actions) return null;
  const question = (head.text.text || "").replace(/^📊\s*/, "").trim();
  const options = actions.elements
    .slice()
    .sort((a, b) => Number(a.value.split(":")[1]) - Number(b.value.split(":")[1]))
    .map((el) => el.text.text);
  if (!question || options.length < 2) return null;
  return { question, options };
}

// Render a poll as Block Kit with a live bar chart + a button per option.
function renderPoll(id, poll) {
  const total = poll.options.reduce((n, o) => n + o.voters.size, 0);
  const blocks = [header(`📊  ${poll.question}`)];

  poll.options.forEach((o) => {
    const count = o.voters.size;
    const pct = total ? Math.round((count / total) * 100) : 0;
    const filled = Math.round(pct / 10);
    const bar = "▓".repeat(filled) + "░".repeat(10 - filled);
    blocks.push(section(`*${o.label}*\n\`${bar}\`  ${count} vote${count === 1 ? "" : "s"} (${pct}%)`));
  });

  blocks.push({
    type: "actions",
    elements: poll.options.map((o, i) => ({
      type: "button",
      text: { type: "plain_text", text: o.label, emoji: true },
      action_id: `poll_vote_${i}`,
      value: `${id}:${i}`
    }))
  });

  blocks.push(context(`${total} total vote${total === 1 ? "" : "s"} • click a button to vote`));
  return blocks;
}

module.exports = {
  name: "poll",
  category: "Utilities",
  summary: "Create a live poll with voting buttons",
  usage: "/astronasamp poll <question> | <option 1> | <option 2>",
  run: async ({ args, respond }) => {
    // Format: poll Question? | Option A | Option B | Option C
    const parts = args.join(" ").split("|").map((s) => s.trim()).filter(Boolean);
    const question = parts.shift();
    const options = parts.slice(0, 8); // cap to keep the UI tidy

    if (!question || options.length < 2) {
      await respond({
        blocks: [section(":bar_chart: Usage: `/astronasamp poll <question> | <option 1> | <option 2>`\nExample: `poll Best language? | JavaScript | Python | Go`")]
      });
      return;
    }

    const id = createPoll(question, options);
    // Post to the channel so everyone can vote (not just the creator).
    await respond({ response_type: "in_channel", blocks: renderPoll(id, getPoll(id)) });
  },

  // Interactivity: every vote button matches this and updates the message live.
  // Updates go through respond() (the click's response_url) rather than
  // chat.update, because the bot only has the chat:write scope and may not be a
  // member of the channel - response_url works regardless of membership and
  // isn't rate-limited in practice (each click carries its own fresh url).
  actionPattern: /^poll_vote_\d+$/,
  onAction: async ({ ack, body, action, respond }) => {
    await ack();
    const [id, idx] = action.value.split(":");
    // Recover from a restart that wiped the store so the click still counts.
    if (!getPoll(id)) {
      const def = pollFromMessage(body.message);
      if (def) restorePoll(id, def.question, def.options);
    }
    const poll = toggleVote(id, Number(idx), body.user.id);
    if (!poll) {
      await respond({ replace_original: false, text: ":hourglass: This poll is no longer active." });
      return;
    }
    await respond({ replace_original: true, response_type: "in_channel", blocks: renderPoll(id, poll) });
  }
};
