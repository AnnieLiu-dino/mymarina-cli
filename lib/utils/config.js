"use strict";

const path = require("path");

const LOWEST_NODE_VERSION = "18.0.0";
const DEFAULT_CLI_HOME = ".marina-cli";
const NPM_NAME = "@mymarina/cli";
const DEPENDENCIES_PATH = "dependencies";
const TEMPLATE_CACHE_DIR = "templates";
const DEFAULT_NPM_REGISTRY = "https://registry.npmjs.org";
const DEFAULT_TEMPLATE_REGISTRY_URL =
  "https://raw.githubusercontent.com/AnnieLiu-dino/mymarina-template-registry/master/templates.json";

function normalizeUrl(url) {
  return String(url || "").replace(/\/+$/, "");
}

function getNpmRegistry(registry) {
  return normalizeUrl(
    registry ||
      process.env.MYMARINA_NPM_REGISTRY ||
      process.env.NPM_CONFIG_REGISTRY ||
      DEFAULT_NPM_REGISTRY,
  );
}

function getTemplateRegistryUrl(registryUrl) {
  return (
    registryUrl ||
    process.env.MYMARINA_TEMPLATE_REGISTRY_URL ||
    DEFAULT_TEMPLATE_REGISTRY_URL
  );
}

function getTemplateCachePath(cliHome) {
  if (!cliHome) {
    throw new Error("cliHome is required.");
  }

  return path.resolve(cliHome, TEMPLATE_CACHE_DIR);
}

module.exports = {
  LOWEST_NODE_VERSION,
  DEFAULT_CLI_HOME,
  NPM_NAME,
  DEPENDENCIES_PATH,
  TEMPLATE_CACHE_DIR,
  DEFAULT_NPM_REGISTRY,
  DEFAULT_TEMPLATE_REGISTRY_URL,
  getNpmRegistry,
  getTemplateRegistryUrl,
  getTemplateCachePath,
};
