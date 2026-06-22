"use strict";

const registry = require("../template/registry");
const consola = require("../utils/consola");

function formatTemplateRow(template) {
  const tags = template.tags.length ? template.tags.join(", ") : "-";
  return `${template.name} | ${template.npmName}@${template.version} | ${tags} | ${template.maintainer} | ${template.description}`;
}

async function list(options = {}) {
  const logger = options.logger || consola;
  const templateRegistry = options.registry || registry;
  const templates = await templateRegistry.getTemplateList({
    registryUrl: options.registryUrl,
  });

  if (!templates.length) {
    logger.warn("No templates found.");
    return templates;
  }

  logger.info("Available templates:");

  for (const template of templates) {
    logger.info(formatTemplateRow(template));
  }

  return templates;
}

module.exports = list;
