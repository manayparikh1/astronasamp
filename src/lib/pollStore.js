// In-memory store for active polls. Gives the bot real state + interactivity
// (votes persist for the life of the process and update live on each click).
const polls = new Map();

function createPoll(question, options) {
  const id = Math.random().toString(36).slice(2, 8);
  polls.set(id, {
    question,
    options: options.map((label) => ({ label, voters: new Set() }))
  });
  return id;
}

function getPoll(id) {
  return polls.get(id);
}

// Single-choice vote: clicking an option moves the user's vote there;
// clicking the same option again removes it (toggle off).
function toggleVote(id, optionIndex, userId) {
  const poll = polls.get(id);
  if (!poll || !poll.options[optionIndex]) return null;
  const already = poll.options[optionIndex].voters.has(userId);
  poll.options.forEach((o) => o.voters.delete(userId));
  if (!already) poll.options[optionIndex].voters.add(userId);
  return poll;
}

module.exports = { createPoll, getPoll, toggleVote };
