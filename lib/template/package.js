"use strict";

const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs-extra");
const npm = require("../utils/npm");
const config = require("../utils/config");

function getPackageRoot(nodeModulesPath, packageName) {
  return path.join(nodeModulesPath, ...packageName.split("/"));
}

function readPackageJson(packageRoot) {
  const packageJsonPath = path.join(packageRoot, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  return fs.readJsonSync(packageJsonPath);
}

function runNpmInstall (job) {
  console.log("job", job)
  return new Promise((resolve, reject) => {
    const child = spawn("npm", job.args, {
      stdio: "inherit",
      cwd: job.cachePath,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`npm install failed with exit code ${code}`));
    });
  });
}

class TemplatePackage {
  constructor(options = {}) {
    if (!options.cliHome) {
      throw new Error("cliHome is required.");
    }

    if (!options.name) {
      throw new Error("template package name is required.");
    }

    this.cliHome = options.cliHome;
    this.packageName = options.name;
    this.packageVersion = options.version || "latest";
    this.registry = config.getNpmRegistry(options.registry);
    this.npmServer = options.npmServer || npm;
    this.runner = options.runner || runNpmInstall;
    // .marina-cli/templates
    this.cachePath = config.getTemplateCachePath(this.cliHome);
    // .marina-cli/templates/node_modules
    this.nodeModulesPath = path.join(this.cachePath, "node_modules");
    // .marina-cli/templates/node_modules/@mymarina/template-vue-app
    this.packageRoot = getPackageRoot(this.nodeModulesPath, this.packageName);
  }

  async prepare() {
    await fs.ensureDir(this.cachePath);
    await fs.ensureDir(this.nodeModulesPath);
  }

  async resolveVersion() {
    if (this.packageVersion === "latest") {
      this.packageVersion = await this.npmServer.getLatestVersion(this.packageName);
    }

    return this.packageVersion;
  }

  async exists() {
    await this.prepare();

    const pkg = readPackageJson(this.packageRoot);
    if (!pkg) {
      return false;
    }

    const version = await this.resolveVersion();
    return pkg.name === this.packageName && pkg.version === version;
  }

  get packageSpec() {
    return `${this.packageName}@${this.packageVersion}`;
  }

  async install(options = {}) {
    await this.prepare();
    await this.resolveVersion();

    if (!options.force && (await this.exists())) {
      return this.packageRoot;
    }

    await this.runner({
      args: ["install", this.packageSpec, "--prefix", this.cachePath, "--registry", this.registry, "--no-save"],
      cachePath: this.cachePath,
      packageRoot: this.packageRoot,
      packageSpec: this.packageSpec,
      registry: this.registry,
    });

    return this.packageRoot;
  }
}

TemplatePackage.runNpmInstall = runNpmInstall;
TemplatePackage.getPackageRoot = getPackageRoot;

module.exports = TemplatePackage;
