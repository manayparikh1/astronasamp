// Tiny structured logger — timestamped, level-prefixed, zero dependencies.
const levels = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = levels[process.env.LOG_LEVEL] || levels.info;

function emit(level, msg, meta) {
  if (levels[level] < threshold) return;
  const time = new Date().toISOString();
  const tail = meta ? " " + JSON.stringify(meta) : "";
  const line = `${time} [${level.toUpperCase()}] ${msg}${tail}`;
  (level === "error" || level === "warn" ? console.error : console.log)(line);
}

module.exports = {
  debug: (m, meta) => emit("debug", m, meta),
  info: (m, meta) => emit("info", m, meta),
  warn: (m, meta) => emit("warn", m, meta),
  error: (m, meta) => emit("error", m, meta)
};
