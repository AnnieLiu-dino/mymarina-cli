"use strict";

const path = require("path");
const fs = require("fs-extra");
const ejs = require("ejs");
const minimatchModule = require("minimatch");
const minimatch = minimatchModule.minimatch || minimatchModule;
const consola = require("../utils/consola");

const DEFAULT_IGNORE = ["**/node_modules/**", "**/.git/**", "**/.DS_Store"];

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".svgz",
  ".pdf",
  ".zip",
  ".gz",
  ".tgz",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
]);

async function installTemplate(options = {}) {
  const { templatePath, targetPath, data = {}, ignore = [] } = options;
  const logger = options.logger || consola;

  if (!templatePath) {
    throw new Error("templatePath is required.");
  }

  if (!targetPath) {
    throw new Error("targetPath is required.");
  }

  await copyTemplate(templatePath, targetPath, logger);
  await renderTemplate(targetPath, data, {
    ignore,
  });
}

async function copyTemplate(templatePath, targetPath, logger = consola) {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  logger.verbose("copyTemplate", templatePath, targetPath);
  await fs.copy(templatePath, targetPath);
}

async function renderTemplate(targetPath, data, options = {}) {
  const ignore = [...DEFAULT_IGNORE, ...(options.ignore || [])];
  const files = await collectFiles(targetPath);

  for (const file of files) {
    const relativePath = toPosixPath(path.relative(targetPath, file));

    if (shouldIgnore(relativePath, ignore)) {
      continue;
    }

    if (isBinaryFile(file)) {
      continue;
    }

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

function shouldIgnore(relativePath, patterns = []) {
  const normalized = toPosixPath(relativePath);

  return patterns.some((pattern) =>
    minimatch(normalized, toPosixPath(pattern), { dot: true }),
  );
}

function isBinaryFile(filePath) {
  return BINARY_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

// path.sep 都转换为 unix风格路径
function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

module.exports = {
  installTemplate,
  copyTemplate,
  renderTemplate,
  collectFiles,
  shouldIgnore,
  isBinaryFile,
};
