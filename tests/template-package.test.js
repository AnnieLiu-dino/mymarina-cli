"use strict";

const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs-extra");

const TemplatePackage = require("../lib/template/package");

async function createPackageJson(packageRoot, pkg) {
  await fs.ensureDir(packageRoot);
  await fs.writeJson(path.join(packageRoot, "package.json"), pkg);
}

test("TemplatePackage installs missing latest template package into cache", async () => {
  const cliHome = await fs.mkdtemp(path.join(os.tmpdir(), "mymarina-package-"));
  const calls = [];
  const pkg = new TemplatePackage({
    cliHome,
    name: "@mymarina/template-vue-app",
    version: "latest",
    npmServer: {
      getLatestVersion: async () => "1.2.3",
    },
    runner: async (job) => {
      calls.push(job);
      await createPackageJson(job.packageRoot, {
        name: "@mymarina/template-vue-app",
        version: "1.2.3",
      });
    },
  });

  const packageRoot = await pkg.install();

  assert.equal(calls.length, 1);
  assert.equal(calls[0].packageSpec, "@mymarina/template-vue-app@1.2.3");
  assert.equal(packageRoot, path.join(cliHome, "templates", "node_modules", "@mymarina", "template-vue-app"));
  assert.equal(await pkg.exists(), true);
});

test("TemplatePackage reuses cache when requested version already exists", async () => {
  const cliHome = await fs.mkdtemp(path.join(os.tmpdir(), "mymarina-package-"));
  const pkg = new TemplatePackage({
    cliHome,
    name: "@mymarina/template-react-app",
    version: "1.0.0",
    runner: async () => {
      throw new Error("runner should not be called for cache hit");
    },
  });

  await createPackageJson(pkg.packageRoot, {
    name: "@mymarina/template-react-app",
    version: "1.0.0",
  });

  const packageRoot = await pkg.install();

  assert.equal(packageRoot, pkg.packageRoot);
});

test("TemplatePackage force option reinstalls cached package", async () => {
  const cliHome = await fs.mkdtemp(path.join(os.tmpdir(), "mymarina-package-"));
  let called = false;
  const pkg = new TemplatePackage({
    cliHome,
    name: "@mymarina/template-force-app",
    version: "2.0.0",
    runner: async (job) => {
      called = true;
      await createPackageJson(job.packageRoot, {
        name: "@mymarina/template-force-app",
        version: "2.0.0",
      });
    },
  });

  await createPackageJson(pkg.packageRoot, {
    name: "@mymarina/template-force-app",
    version: "2.0.0",
  });

  await pkg.install({ force: true });

  assert.equal(called, true);
});
