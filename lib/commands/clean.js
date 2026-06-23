"use strict";

const fs = require("fs-extra");
const consola = require("../utils/consola");
const config = require("../utils/config");

async function clean(options = {}) {
  const logger = options.logger || consola;
  const cliHome = options.context?.cliHome;

  if (!cliHome) {
    throw new Error("cliHome is required.");
  }

  const cleanedPath = options.all
    ? cliHome
    : config.getTemplateCachePath(cliHome);

  await fs.ensureDir(cleanedPath);
  await fs.emptyDir(cleanedPath);

  if (options.all) {
    logger.success(`CLI home cleaned: ${cleanedPath}`);
  } else {
    logger.success(`Template cache cleaned: ${cleanedPath}`);
  }

  return {
    cleanedPath,
  };
}

module.exports = clean;
