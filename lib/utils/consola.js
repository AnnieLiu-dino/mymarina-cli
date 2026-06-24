"use strict";

const { createConsola } = require("consola");

const levelMap = {
  silent: -999,
  error: 0,
  fatal: 0,
  warn: 1,
  log: 2,
  info: 3,
  success: 3,
  debug: 4,
  trace: 5,
  verbose: Infinity,
};

const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const log = createConsola({
  level: levelMap[LOG_LEVEL] ?? levelMap.info,
}).withTag("marina");

log.setLevel = function setLevel(level) {
  log.level = levelMap[level] ?? levelMap.info;
};

module.exports = log;
