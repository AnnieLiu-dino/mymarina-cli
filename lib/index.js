"use strict";

const { Command } = require("commander");
const pkg = require("../package.json");
const check = require("./utils/check");
const create = require("./commands/create");
const consola = require("./utils/consola");

class RegisterCommands {
  constructor() {
    this.program = new Command();
    this.init();
  }

  init() {
    this.program
      .name("mymarina")
      .usage("<command> [options]")
      .version(pkg.version)
      .option("-d, --debug", "enable debug mode");

    this.program
      .command("create <projectName>")
      .description("create a new project")
      .option("-t, --template <template>", "specify the project template", "default")
      .option("--packagePath <packagePath>", "specify the local template package path")
      .option("-f, --force", "overwrite target directory")
      .action(async (projectName, options) => {
        try {
          await create(projectName, options);
        } catch (e) {
          consola.error(e.message);
          process.exit(1);
        }
      });

    this.program.on("command:*", (operands) => {
      consola.error("Unknown command:", operands.join(" "));
      this.program.outputHelp();
    });

    this.program.parse(process.argv);

    if (!process.argv.slice(2).length) {
      this.program.outputHelp();
    }
  }
}

async function main() {
  try {
    await check.prepare();
    new RegisterCommands();
  } catch (e) {
    consola.error(e.message);
  }
}

module.exports = main;
