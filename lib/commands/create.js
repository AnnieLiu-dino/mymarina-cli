"use strict";

const path = require("path");
const fs = require("fs-extra");
const ejs = require("ejs");
const consola = require("../utils/consola");
const templates = require("../templates/templates.json");

async function create(projectName, options) {
  const targetPath = path.resolve(process.cwd(), projectName);
  const templatePath = resolveTemplatePath(options);

  consola.verbose("create projectName:", projectName);
  consola.verbose("create options:", options);
  consola.verbose("create targetPath:", targetPath);

  await prepareTargetDir(targetPath, projectName, options);
  await copyTemplate(templatePath, targetPath);
  await renderTemplate(targetPath, {
    projectName,
  });

  consola.success(`项目创建成功：${targetPath}`);
  consola.info(`cd ${projectName}
    npm install
    npm run dev`);
}

function resolveTemplatePath(options) {
  if (options.packagePath) {
    const templatePath = path.resolve(process.cwd(), options.packagePath);
    consola.verbose("resolve template from packagePath:", templatePath);
    return templatePath;
  }

  const templateName = options.template || "default";
  const template = templates.find((item) => item.name === templateName);
  consola.verbose("resolve templateName:", templateName);

  if (!template) {
    const names = templates.map((item) => item.name).join(", ");
    throw new Error(`模板不存在：${templateName}。可用模板：${names}`);
  }

  const templatePath = path.resolve(__dirname, "../templates", template.dir);
  consola.verbose("resolve templatePath:", templatePath);
  return templatePath;
}

async function prepareTargetDir(targetPath, projectName, options) {
  if (fs.existsSync(targetPath)) {
    if (!options.force) {
      throw new Error(`目标目录已存在：${projectName}，如需覆盖请使用 --force`);
    }

    consola.warn(`正在清空目录：${targetPath}`);
    await fs.emptyDir(targetPath);
    return;
  }

  await fs.ensureDir(targetPath);
}

async function copyTemplate(templatePath, targetPath) {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`模板不存在：${templatePath}`);
  }

  consola.verbose(`copy template from ${templatePath} to ${targetPath}`);
  await fs.copy(templatePath, targetPath);
}

async function renderTemplate(targetPath, data) {
  const files = await collectFiles(targetPath);

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const result = ejs.render(content, data);
    await fs.writeFile(file, result);
  }
}

async function collectFiles(dir) {
  const result = [];
  const items = await fs.readdir(dir);

  for (const item of items) {
    const filePath = path.resolve(dir, item);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      const childFiles = await collectFiles(filePath);
      result.push(...childFiles);
    } else {
      result.push(filePath);
    }
  }

  return result;
}

module.exports = create;
