"use strict";

const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs-extra");

const templateConfig = require("../lib/template/config");

async function createTemplatePackage(files = {}) {
  const packageRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "mymarina-template-config-"),
  );

  await fs.writeJson(path.join(packageRoot, "package.json"), {
    name: "@mymarina/template-demo",
    version: "1.0.0",
  });

  if (files.config !== false) {
    await fs.writeJson(path.join(packageRoot, "template.config.json"), {
      prompts: [
        {
          name: "description",
          message: "Project description",
          default: "A mymarina project",
        },
      ],
      ignore: ["**/*.png"],
      scripts: {
        dev: "npm run dev",
        build: "npm run build",
      },
      ...files.config,
    });
  }

  if (files.template !== false) {
    await fs.ensureDir(path.join(packageRoot, "template"));
    await fs.writeFile(
      path.join(packageRoot, "template", "README.md"),
      "# <%= projectName %>\n",
    );
  }

  return packageRoot;
}

test("loadTemplateConfig returns normalized template package protocol", async () => {
  const packageRoot = await createTemplatePackage();

  const result = await templateConfig.loadTemplateConfig(packageRoot);

  assert.equal(result.packageRoot, packageRoot);
  assert.equal(result.templatePath, path.join(packageRoot, "template"));
  assert.equal(
    result.configPath,
    path.join(packageRoot, "template.config.json"),
  );
  assert.deepEqual(result.config.prompts, [
    {
      name: "description",
      message: "Project description",
      default: "A mymarina project",
    },
  ]);
  assert.deepEqual(result.config.ignore, ["**/*.png"]);
  assert.deepEqual(result.config.scripts, {
    dev: "npm run dev",
    build: "npm run build",
  });
});

test("loadTemplateConfig rejects package without template.config.json", async () => {
  const packageRoot = await createTemplatePackage({
    config: false,
  });

  await assert.rejects(
    () => templateConfig.loadTemplateConfig(packageRoot),
    /Template package is missing template.config.json/,
  );
});

test("loadTemplateConfig rejects package without template directory", async () => {
  const packageRoot = await createTemplatePackage({
    template: false,
  });

  await assert.rejects(
    () => templateConfig.loadTemplateConfig(packageRoot),
    /Template package is missing template directory/,
  );
});

test("loadTemplateConfig fills optional fields with defaults", async () => {
  const packageRoot = await createTemplatePackage({
    config: {
      prompts: undefined,
      ignore: undefined,
      scripts: undefined,
    },
  });

  const result = await templateConfig.loadTemplateConfig(packageRoot);

  assert.deepEqual(result.config.prompts, []);
  assert.deepEqual(result.config.ignore, []);
  assert.deepEqual(result.config.scripts, {});
});
