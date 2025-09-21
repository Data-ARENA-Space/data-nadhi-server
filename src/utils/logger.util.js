class Logger {
  constructor({ level = "info" } = {}) {
    this.level = level;
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
  }

  log(level, message, context = {}) {
    if (this.levels[level] > this.levels[this.level]) return;

    const logEntry = {
      level,
      message,
      context,
    };

    console.log(JSON.stringify(logEntry));
  }

  error(msg, context) { this.log("error", msg, context); }
  warn(msg, context)  { this.log("warn", msg, context); }
  info(msg, context)  { this.log("info", msg, context); }
  debug(msg, context) { this.log("debug", msg, context); }
}

module.exports = Logger;