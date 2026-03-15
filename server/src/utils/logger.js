const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp }) =>
  `${timestamp} [${level}]: ${message}`
);

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), colorize(), logFormat),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

module.exports = logger;
