"use strict";

const { Command } = require("commander");
const pkg = require("../package.json");
const precheck = require("./core/precheck");
const create = require("./commands/create");
const list = require("./commands/list");
const consola = require("./utils/consola");
const clean = require("./commands/clean");
const doctor = require("./commands/doctor");

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
    this.registerListCommand();
    this.registerCleanCommand();
    this.registerDoctorCommand();
  }

  registerCreateCommand() {
    this.program
      .command("create <projectName>")
      .description("create a new project")
      .option("-t, --template <template>", "specify the project template")
      .option(
        "--template-version <templateVersion>",
        "specify the template package version",
      )
      .option(
        "--registryUrl <registryUrl>",
        "specify the remote template registry url",
      )
      .option(
        "--packagePath <packagePath>",
        "specify the local template package root path",
      )
      .option("--force-update", "force update cached template package")
      .option("-f, --force", "overwrite target directory")

      .action((projectName, options) => {
        return this.runCommand(async (context) => {
          await create(projectName, {
            templateName: options.template,
            templateVersion: options.templateVersion,
            registryUrl: options.registryUrl,
            packagePath: options.packagePath,
            forceUpdate: options.forceUpdate,
            force: options.force,
            context,
          });
        });
      });
  }

  registerListCommand() {
    this.program
      .command("list")
      .alias("ls")
      .description("list available project templates")
      .option(
        "--registryUrl <registryUrl>",
        "specify the remote template registry url",
      )
      .action((options) => {
        return this.runCommand(async () => {
          await list({
            registryUrl: options.registryUrl,
          });
        });
      });
  }
  registerCleanCommand() {
    this.program
      .command("clean")
      .description("clean mymarina cache")
      .option("-a, --all", "clean all cli home files")
      .action((options) => {
        return this.runCommand(async (context) => {
          await clean({
            all: options.all,
            context,
          });
        });
      });
  }

  registerDoctorCommand() {
    this.program
      .command("doctor")
      .description("check local environment for mymarina")
      .option(
        "--registryUrl <registryUrl>",
        "specify the remote template registry url",
      )
      .option("--npmRegistry <npmRegistry>", "specify npm registry")
      .action((options) => {
        return this.runCommand(async (context) => {
          await doctor({
            registryUrl: options.registryUrl,
            npmRegistry: options.npmRegistry,
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
