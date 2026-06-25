// Block Kit helpers so every command speaks one consistent visual language.

const section = (text) => ({ type: "section", text: { type: "mrkdwn", text } });

const header = (text) => ({
  type: "header",
  text: { type: "plain_text", text, emoji: true }
});

const divider = () => ({ type: "divider" });

const context = (text) => ({
  type: "context",
  elements: [{ type: "mrkdwn", text }]
});

const fields = (pairs) => ({
  type: "section",
  fields: pairs.map((t) => ({ type: "mrkdwn", text: t }))
});

// A standard friendly error card (used by the global command wrapper).
const errorCard = (message) => ({
  blocks: [section(`:warning: ${message}`)]
});

module.exports = { section, header, divider, context, fields, errorCard };
