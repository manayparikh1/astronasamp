// Auto-discovers every module in ./commands and indexes it by name + aliases.
// Adding a new command = dropping a file in src/commands. No wiring needed.
const fs = require("fs");
const path = require("path");
const logger = require("./lib/logger");

const commandsDir = path.join(__dirname, "commands");
const byName = new Map(); // lookup key (name/alias) -> command
const all = []; // unique command modules

for (const file of fs.readdirSync(commandsDir)) {
  if (!file.endsWith(".js")) continue;
  const cmd = require(path.join(commandsDir, file));
  if (!cmd.name || typeof cmd.run !== "function") {
    logger.warn("skipping invalid command file", { file });
    continue;
  }
  all.push(cmd);
  const keys = [cmd.name, ...(cmd.aliases || [])];
  for (const key of keys) byName.set(key.toLowerCase(), cmd);
}

logger.info("commands loaded", { count: all.length, names: all.map((c) => c.name) });

module.exports = {
  get: (key) => byName.get((key || "").toLowerCase()),
  unique: () => all,
  has: (key) => byName.has((key || "").toLowerCase())
};
