"use strict";

const path = require("path");
const fs = require("fs-extra");

function ensurePackageRoot(packageRoot) {
  if (!packageRoot) {
    throw new Error("packageRoot is required.");
  }

  if (!fs.existsSync(packageRoot)) {
    throw new Error(`Template package root does not exist: ${packageRoot}`);
  }
}

function normalizeTemplateConfig(config = {}) {
  return {
    prompts: Array.isArray(config.prompts) ? config.prompts : [],
    ignore: Array.isArray(config.ignore) ? config.ignore : [],
    scripts:
      config.scripts && typeof config.scripts === "object"
        ? config.scripts
        : {},
  };
}

async function loadTemplateConfig(packageRoot) {
  ensurePackageRoot(packageRoot);

  const configPath = path.join(packageRoot, "template.config.json");
  const templatePath = path.join(packageRoot, "template");

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Template package is missing template.config.json: ${configPath}`,
    );
  }

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Template package is missing template directory: ${templatePath}`,
    );
  }

  const stat = await fs.stat(templatePath);
  if (!stat.isDirectory()) {
    throw new Error(`Template path must be a directory: ${templatePath}`);
  }

  const rawConfig = await fs.readJson(configPath);
  const config = normalizeTemplateConfig(rawConfig);

  return {
    packageRoot,
    configPath,
    templatePath,
    config,
  };
}

module.exports = {
  loadTemplateConfig,
  normalizeTemplateConfig,
};
