const { createPoll, getPoll, toggleVote } = require("../lib/pollStore");
const { header, section, context } = require("../lib/blocks");

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
  actionPattern: /^poll_vote_\d+$/,
  onAction: async ({ ack, body, action, respond }) => {
    await ack();
    const [id, idx] = action.value.split(":");
    const poll = toggleVote(id, Number(idx), body.user.id);
    if (!poll) {
      await respond({ replace_original: false, text: ":hourglass: This poll is no longer active." });
      return;
    }
    await respond({ replace_original: true, response_type: "in_channel", blocks: renderPoll(id, poll) });
  }
};
