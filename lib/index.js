"use strict";

const { Command } = require("commander");
const pkg = require("../package.json");
const precheck = require("./core/precheck");
const create = require("./commands/create");
const consola = require("./utils/consola");

class MarinaCli {
  constructor() {
    this.program = new Command();
    this.init();
  }

  init() {
    this.program
      .name("mymarina")
      .usage("<command> [options]")
      .description(pkg.description)
      .version(pkg.version)
      .option("-d, --debug", "enable debug mode")
      .showHelpAfterError(true)
      .showSuggestionAfterError(true);

    this.registerCreateCommand();
  }

  registerCreateCommand() {
    this.program
      .command("create <projectName>")
      .description("create a new project")
      .option("-t, --template <template>", "specify the project template", "default")
      .option("--packagePath <packagePath>", "specify the local template package path")
      .option("-f, --force", "overwrite target directory")
      .action((projectName, options) => {
        return this.runCommand(async (context) => {
          await create(projectName, {
            template: options.template,
            packagePath: options.packagePath,
            force: options.force,
            context,
          });
        });
      });
  }

  async runCommand(handler) {
    try {
      const context = await precheck.prepare(process.argv.slice(2));
      await handler(context);
    } catch (e) {
      consola.error(e.message);

      if (process.argv.includes("--debug") || process.argv.includes("-d")) {
        consola.error(e.stack);
      }

      process.exitCode = 1;
    }
  }

  async run(argv = process.argv) {
    if (!argv.slice(2).length) {
      this.program.outputHelp();
      return;
    }

    await this.program.parseAsync(argv);
  }
}

async function main() {
  const cli = new MarinaCli();
  await cli.run();
}

module.exports = main;
