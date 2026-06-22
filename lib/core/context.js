"use strict";

const os = require("os");
const path = require("path");
const minimist = require("minimist");
const dotenv = require("dotenv");
const { DEFAULT_CLI_HOME } = require("../utils/config");

function createContext(argv = process.argv.slice(2)) {
  const args = minimist(argv, {
    boolean: ["debug"],
    alias: {
      d: "debug",
    },
  });

  const userHome = os.homedir();

  if (userHome) {
    dotenv.config({
      quiet: true,
      path: path.resolve(userHome, ".env"),
    });
  }

  const cliHomeName = process.env.CLI_HOME || DEFAULT_CLI_HOME;
  const cliHome = userHome ? path.join(userHome, cliHomeName) : "";

  return {
    args,
    debug: Boolean(args.debug),
    cwd: process.cwd(),
    userHome,
    cliHome,
  };
}

module.exports = createContext;
