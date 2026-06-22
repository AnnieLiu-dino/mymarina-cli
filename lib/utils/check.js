const os = require("os");
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const minimist = require("minimist");
const dotenv = require("dotenv");
const colors = require("colors");
const rootCheck = require("root-check");
const pkg = require("../../package.json");
const consola = require("./consola");
const npm = require("./npm");
const { DEFAULT_CLI_HOME, LOWEST_NODE_VERSION, NPM_NAME } = require("./config");

class PreCheck {
  constructor() {
    this.context = {
      args: {},
      userHome: "",
      cliConfig: {},
    };
  }

  async prepare () {
    // Parse CLI arguments with minimist and enable verbose logs for --debug.
    this.inputArgs();
    // Ensure the current Node.js version satisfies the configured minimum.
    this.nodeVersion();
    // Avoid running the CLI as root; root-check may downgrade permissions.
    this.isRoot();
    // Ensure the current user's home directory exists.
    this.userHome();
    // Load global environment variables into process.env.
    this.loadEnvConfig();
    try {
      // Fetch npm metadata and warn when a newer CLI version exists.
      await this.update();
    } catch (e) {
      consola.warn(`Update check failed: ${e.message}`);
    }
  }

  nodeVersion() {
    consola.verbose("checkNodeVersion");
    consola.verbose(
      `Node version: current=${process.version}, lowest=${LOWEST_NODE_VERSION}`,
    );

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

  userHome() {
    const userHome = os.homedir();

    if (!userHome || !fs.existsSync(userHome)) {
      throw new Error("The current user's home directory does not exist.");
    }

    this.context.userHome = userHome;
  }

  inputArgs() {
    const args = minimist(process.argv.slice(2));

    this.context.args = args;

    consola.level = args.debug ? "verbose" : "info";
  }

  loadEnvConfig() {
    const { userHome } = this.context;

    dotenv.config({
      quiet: true,
      path: path.resolve(userHome, ".env"),
    });

    const cliHome = process.env.CLI_HOME || DEFAULT_CLI_HOME;

    this.context.cliConfig = {
      home: userHome,
      cliHome: path.join(userHome, cliHome),
    };

    consola.verbose(`cliHome: ${this.context.cliConfig.cliHome}`);
  }

  async update() {
    const currentVersion = pkg.version;
    consola.verbose(`check update: ${NPM_NAME}@${currentVersion}`);

    const lastVersion = await npm.getNpmLatestSemverVersion(
      NPM_NAME,
      currentVersion,
    );

    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
      consola.warn(`Please update ${NPM_NAME}: ${currentVersion} -> ${lastVersion}`);
    }
  }
}

module.exports = new PreCheck();
