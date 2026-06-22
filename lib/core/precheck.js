"use strict";

const fs = require("fs");
const semver = require("semver");
const colors = require("colors");
const rootCheck = require("root-check");

const pkg = require("../../package.json");
const consola = require("../utils/consola");
const npm = require("../utils/npm");
const createContext = require("./context");
const { LOWEST_NODE_VERSION, NPM_NAME } = require("../utils/config");

class PreCheck {
  async prepare(argv = process.argv.slice(2)) {
    const context = createContext(argv);

    this.nodeVersion();
    this.isRoot();
    this.userHome(context);

    try {
      await this.update();
    } catch (e) {
      consola.warn(`Update check failed: ${e.message}`);
    }

    return context;
  }

  nodeVersion() {
    consola.verbose(`Node version: current=${process.version}, lowest=${LOWEST_NODE_VERSION}`);

    if (!semver.gte(process.version, LOWEST_NODE_VERSION)) {
      throw new Error(`CLI requires Node.js >= ${LOWEST_NODE_VERSION}`);
    }
  }

  isRoot() {
    consola.verbose("before:", process.getuid?.());
    const message = colors.red("Please avoid running this CLI as root.");
    rootCheck(message);
    consola.verbose("after:", process.getuid?.());
  }

  userHome(context) {
    if (!context.userHome || !fs.existsSync(context.userHome)) {
      throw new Error("The current user's home directory does not exist.");
    }

    consola.verbose(`userHome: ${context.userHome}`);
    consola.verbose(`cliHome: ${context.cliHome}`);
  }

  async update() {
    const currentVersion = pkg.version;
    consola.verbose(`check update: ${NPM_NAME}@${currentVersion}`);

    const lastVersion = await npm.getNpmLatestSemverVersion(NPM_NAME, currentVersion);

    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
      consola.warn(`Please update ${NPM_NAME}: ${currentVersion} -> ${lastVersion}`);
      consola.warn(`Run: npm install -g ${NPM_NAME}@${lastVersion}`);
    }
  }
}

module.exports = new PreCheck();
