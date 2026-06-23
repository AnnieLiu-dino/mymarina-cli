"use strict";

const path = require("path");
const fs = require("fs-extra");
const consola = require("../utils/consola");
const prompt = require("../utils/prompt");
const registry = require("../template/registry");
const TemplatePackage = require("../template/package");
const { loadTemplateConfig } = require("../template/config");
const renderer = require("../template/renderer");

async function create(projectName, options = {}) {
  const logger = options.logger || consola;
  const targetPath = path.resolve(process.cwd(), projectName);
  const templateSource = await resolveTemplateSource(options);
  const data = await collectTemplateData(
    projectName,
    templateSource.config,
    options,
  );

  logger.verbose("create projectName:", projectName);
  logger.verbose("create options:", options);
  logger.verbose("create targetPath:", targetPath);
  logger.verbose("create templatePath:", templateSource.templatePath);

  await prepareTargetDir(targetPath, projectName, options);

  await renderer.installTemplate({
    templatePath: templateSource.templatePath,
    targetPath,
    data,
    ignore: templateSource.config.ignore,
  });

  logger.success(`Project created: ${targetPath}`);
  printNextSteps(projectName, templateSource.config, logger);

  return {
    targetPath,
    templatePath: templateSource.templatePath,
    data,
  };
}

async function resolveTemplateSource(options) {
  if (options.packagePath) {
    const packageRoot = path.resolve(process.cwd(), options.packagePath);
    return loadTemplateConfig(packageRoot);
  }

  const selectedTemplate = await resolveTemplateMeta(options);

  if (selectedTemplate.dir) {
    return resolveBuiltInTemplateSource(selectedTemplate);
  }

  const TemplatePackageCtor = options.TemplatePackage || TemplatePackage;
  const cliHome = options.context?.cliHome;

  if (!cliHome) {
    throw new Error("cliHome is required to install remote template package.");
  }

  const templatePackage = new TemplatePackageCtor({
    cliHome,
    name: selectedTemplate.npmName,
    version: options.templateVersion || selectedTemplate.version,
    registry: options.npmRegistry,
  });

  const packageRoot = await templatePackage.install({
    force: options.forceUpdate,
  });

  return loadTemplateConfig(packageRoot);
}

async function resolveTemplateMeta(options) {
  const templateRegistry = options.registry || registry;
  const templateList = await templateRegistry.getTemplateList({
    registryUrl: options.registryUrl,
  });

  let templateName = options.template;

  if (!templateName) {
    const promptClient = options.prompt || prompt;

    templateName = await promptClient.askSelect({
      message: "Select a project template",
      choices: templateList.map((item) => prompt.createTemplateChoice(item)),
    });
  }

  const selectedTemplate = templateList.find(
    (item) => item.name === templateName || item.npmName === templateName,
  );

  if (!selectedTemplate) {
    const names = templateList.map((item) => item.name).join(", ");
    throw new Error(
      `Template not found: ${templateName}. Available templates: ${names}`,
    );
  }

  return selectedTemplate;
}

function resolveBuiltInTemplateSource(templateMeta) {
  const templatePath = path.resolve(
    __dirname,
    "../templates",
    templateMeta.dir,
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  return {
    packageRoot: templatePath,
    configPath: "",
    templatePath,
    config: {
      prompts: [],
      ignore: [],
      scripts: {
        install: "npm install",
        dev: "npm run dev",
      },
    },
  };
}

async function collectTemplateData(projectName, templateConfig, options) {
  const data = {
    projectName,
  };
  const promptClient = options.prompt || prompt;

  for (const item of templateConfig.prompts) {
    if (!item.name) {
      throw new Error("Template prompt is missing name.");
    }

    data[item.name] = await promptClient.askText({
      message: item.message || item.name,
      defaultValue: item.default || "",
    });
  }

  return data;
}

async function prepareTargetDir(targetPath, projectName, options) {
  if (fs.existsSync(targetPath)) {
    if (!options.force) {
      throw new Error(
        `Target directory already exists: ${projectName}. Use --force to overwrite it.`,
      );
    }

    consola.warn(`Clearing directory: ${targetPath}`);
    await fs.emptyDir(targetPath);
    return;
  }

  await fs.ensureDir(targetPath);
}

function printNextSteps(projectName, templateConfig, logger) {
  const scripts = Object.values(templateConfig.scripts || {});

  logger.info(`cd ${projectName}`);

  if (!scripts.length) {
    logger.info("npm install");
    logger.info("npm run dev");
    return;
  }

  for (const script of scripts) {
    logger.info(script);
  }
}

module.exports = create;
