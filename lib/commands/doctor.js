"use strict";

const fs = require("fs");
const { spawn } = require("child_process");
const semver = require("semver");
const consola = require("../utils/consola");
const config = require("../utils/config");

function runCommand(command, args = ["--version"]) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });

    child.on("error", (e) => {
      resolve({
        ok: false,
        output: e.message,
      });
    });

    child.on("exit", (code) => {
      resolve({
        ok: code === 0,
        output: output.trim(),
      });
    });
  });
}

function printCheck(logger, check) {
  const message = `${check.name}: ${check.detail}`;

  if (check.ok) {
    logger.success(message);
  } else {
    logger.warn(message);
  }
}

async function doctor(options = {}) {
  const logger = options.logger || consola;
  const commandRunner = options.commandRunner || runCommand;
  const context = options.context || {};
  const checks = [];

  const nodeOk = semver.gte(process.version, config.LOWEST_NODE_VERSION);
  checks.push({
    name: "Node.js",
    ok: nodeOk,
    detail: `${process.version} (required >= ${config.LOWEST_NODE_VERSION})`,
  });

  const npmResult = await commandRunner("npm", ["--version"]);
  checks.push({
    name: "npm",
    ok: npmResult.ok,
    detail: npmResult.output || "available",
  });

  const gitResult = await commandRunner("git", ["--version"]);
  checks.push({
    name: "git",
    ok: gitResult.ok,
    detail: gitResult.output || "available",
  });

  checks.push({
    name: "userHome",
    ok: Boolean(context.userHome && fs.existsSync(context.userHome)),
    detail: context.userHome || "missing",
  });

  checks.push({
    name: "cliHome",
    ok: Boolean(context.cliHome),
    detail: context.cliHome || "missing",
  });

  checks.push({
    name: "template registry",
    ok: true,
    detail: config.getTemplateRegistryUrl(options.registryUrl),
  });

  checks.push({
    name: "npm registry",
    ok: true,
    detail: config.getNpmRegistry(options.npmRegistry),
  });

  logger.info("mymarina doctor");

  for (const check of checks) {
    printCheck(logger, check);
  }

  return checks;
}

doctor.runCommand = runCommand;

module.exports = doctor;
