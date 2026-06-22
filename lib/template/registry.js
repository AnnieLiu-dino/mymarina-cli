"use strict";

const request = require("../utils/request");
const config = require("../utils/config");
const fallbackTemplates = require("../templates/templates.json");

const REQUIRED_FIELDS = ["name", "description", "npmName", "version", "tags", "maintainer"];

function validateTemplate(template, index) {
  for (const field of REQUIRED_FIELDS) {
    if (template[field] === undefined || template[field] === null || template[field] === "") {
      throw new Error(`Template record at index ${index} is missing required field: ${field}`);
    }
  }

  if (!Array.isArray(template.tags)) {
    throw new Error(`Template record at index ${index} field tags must be an array.`);
  }

  return {
    name: template.name,
    description: template.description,
    npmName: template.npmName,
    version: template.version,
    tags: template.tags,
    maintainer: template.maintainer,
  };
}

function validateTemplateList(templates) {
  if (!Array.isArray(templates)) {
    throw new Error("Template registry response must be an array.");
  }

  return templates.map((template, index) => validateTemplate(template, index));
}

async function getTemplateList(options = {}) {
  const registryUrl = config.getTemplateRegistryUrl(options.registryUrl);
  const requestClient = options.requestClient || request;
  let templates;

  try {
    templates = await requestClient.get(registryUrl);
  } catch (e) {
    if (options.fallback === false) {
      throw e;
    }

    templates = fallbackTemplates;
  }

  return validateTemplateList(templates);
}

module.exports = {
  getTemplateList,
  validateTemplateList,
};
