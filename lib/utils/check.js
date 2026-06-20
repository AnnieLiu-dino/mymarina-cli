const os = require("os");
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const minimist = require("minimist");
const dotenv = require("dotenv");
const colors = require("colors");
const rootCheck = require("root-check").default || require("root-check");

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

  async prepare() {
    this.inputArgs();
    this.nodeVersion();
    this.isRoot();
    this.userHome();
    this.env();
    try {
      await this.update();
    } catch (e) {
      consola.warn(`更新检查失败：${e.message}`);
    }
  }

  nodeVersion() {
    consola.verbose("checkNodeVersion");
    consola.verbose(
      `Node version: current=${process.version}, lowest=${LOWEST_NODE_VERSION}`,
    );

    if (!semver.gte(process.version, LOWEST_NODE_VERSION)) {
      throw new Error(`cli 需要 Node >= ${LOWEST_NODE_VERSION}`);
    }
  }

  isRoot() {
    consola.verbose("before:", process.getuid?.());
    const message = colors.red("请避免使用 root 账户启动本应用");
    rootCheck(message);
    consola.verbose("after:", process.getuid?.());
  }

  userHome() {
    const userHome = os.homedir();

    if (!userHome || !fs.existsSync(userHome)) {
      throw new Error("当前登录用户主目录不存在！");
    }

    this.context.userHome = userHome;
  }

  inputArgs() {
    const args = minimist(process.argv.slice(2));

    this.context.args = args;

    consola.level = args.debug ? "verbose" : "info";
  }

  env() {
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
      consola.warn(`请更新 ${NPM_NAME}：${currentVersion} -> ${lastVersion}`);
    }
  }
}

module.exports = new PreCheck();
