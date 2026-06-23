"use strict";

const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs-extra");

const renderer = require("../lib/template/renderer");

async function createTemplateDir() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "mymarina-renderer-"));
  const templatePath = path.join(root, "template");
  const targetPath = path.join(root, "target");

  await fs.ensureDir(path.join(templatePath, "src"));
  await fs.ensureDir(path.join(templatePath, "assets"));

  await fs.writeJson(path.join(templatePath, "package.json"), {
    name: "<%= projectName %>",
    description: "<%= description %>",
  });

  await fs.writeFile(
    path.join(templatePath, "src", "index.js"),
    'console.log("<%= projectName %>");\n',
  );

  await fs.writeFile(
    path.join(templatePath, "README.md"),
    "# <%= projectName %>\n",
  );

  await fs.writeFile(
    path.join(templatePath, "assets", "logo.png"),
    Buffer.from([0, 1, 2, 3, 4]),
  );

  return {
    templatePath,
    targetPath,
  };
}

test("installTemplate copies template and renders text files", async () => {
  const { templatePath, targetPath } = await createTemplateDir();

  await renderer.installTemplate({
    templatePath,
    targetPath,
    data: {
      projectName: "demo-app",
      description: "Demo description",
    },
  });

  const pkg = await fs.readJson(path.join(targetPath, "package.json"));
  const index = await fs.readFile(
    path.join(targetPath, "src", "index.js"),
    "utf8",
  );

  assert.equal(pkg.name, "demo-app");
  assert.equal(pkg.description, "Demo description");
  assert.equal(index, 'console.log("demo-app");\n');
});

test("installTemplate keeps ignored text files unrendered", async () => {
  const { templatePath, targetPath } = await createTemplateDir();

  await renderer.installTemplate({
    templatePath,
    targetPath,
    data: {
      projectName: "demo-app",
      description: "Demo description",
    },
    ignore: ["**/*.md"],
  });

  const readme = await fs.readFile(path.join(targetPath, "README.md"), "utf8");

  assert.equal(readme, "# <%= projectName %>\n");
});

test("installTemplate does not render binary files", async () => {
  const { templatePath, targetPath } = await createTemplateDir();

  await renderer.installTemplate({
    templatePath,
    targetPath,
    data: {
      projectName: "demo-app",
      description: "Demo description",
    },
  });

  const logo = await fs.readFile(path.join(targetPath, "assets", "logo.png"));

  assert.deepEqual([...logo], [0, 1, 2, 3, 4]);
});
