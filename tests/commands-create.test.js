"use strict";

const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs-extra");

const create = require("../lib/commands/create");

async function createTemplatePackage(config = {}) {
  const packageRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "mymarina-create-template-"),
  );
  const templatePath = path.join(packageRoot, "template");

  await fs.writeJson(path.join(packageRoot, "package.json"), {
    name: "@mymarina/template-demo",
    version: "1.0.0",
  });

  await fs.writeJson(path.join(packageRoot, "template.config.json"), {
    prompts: [
      {
        name: "description",
        message: "Project description",
        default: "Default description",
      },
    ],
    ignore: [],
    scripts: {
      dev: "npm run dev",
    },
    ...config,
  });

  await fs.ensureDir(path.join(templatePath, "src"));
  await fs.writeJson(path.join(templatePath, "package.json"), {
    name: "<%= projectName %>",
    description: "<%= description %>",
  });
  await fs.writeFile(
    path.join(templatePath, "src", "index.js"),
    'console.log("<%= projectName %>");\n',
  );

  return packageRoot;
}

test("create command creates project from local template package protocol", async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "mymarina-create-"));
  const packageRoot = await createTemplatePackage();
  const previousCwd = process.cwd();
  const logs = [];

  process.chdir(cwd);

  try {
    const result = await create("demo-app", {
      packagePath: packageRoot,
      force: true,
      prompt: {
        askText: async () => "Demo description",
      },
      logger: {
        verbose: () => {},
        warn: (...args) => logs.push(args.join(" ")),
        info: (...args) => logs.push(args.join(" ")),
        success: (...args) => logs.push(args.join(" ")),
      },
    });

    const generatedPkg = await fs.readJson(
      path.join(cwd, "demo-app", "package.json"),
    );
    const generatedIndex = await fs.readFile(
      path.join(cwd, "demo-app", "src", "index.js"),
      "utf8",
    );

    assert.equal(result.targetPath, path.join(process.cwd(), "demo-app"));
    assert.equal(generatedPkg.name, "demo-app");
    assert.equal(generatedPkg.description, "Demo description");
    assert.equal(generatedIndex, 'console.log("demo-app");\n');
    assert.match(logs.join("\n"), /npm run dev/);
  } finally {
    process.chdir(previousCwd);
  }
});

test("create command resolves remote template through registry and TemplatePackage", async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "mymarina-create-"));
  const packageRoot = await createTemplatePackage({
    scripts: {
      dev: "pnpm dev",
    },
  });
  const previousCwd = process.cwd();
  let templatePackageOptions;

  class FakeTemplatePackage {
    constructor(options) {
      templatePackageOptions = options;
    }

    async install() {
      return packageRoot;
    }
  }

  process.chdir(cwd);

  try {
    await create("finance-app", {
      template: "finance-admin",
      templateVersion: "1.2.3",
      force: true,
      context: {
        cliHome: path.join(cwd, ".marina-cli"),
      },
      registry: {
        getTemplateList: async () => [
          {
            name: "finance-admin",
            description: "Finance admin template",
            npmName: "@mymarina/template-finance-admin",
            version: "latest",
            tags: ["vue3", "admin"],
            maintainer: "finance-fe",
          },
        ],
      },
      TemplatePackage: FakeTemplatePackage,
      prompt: {
        askText: async () => "Finance admin template",
      },
      logger: {
        verbose: () => {},
        warn: () => {},
        info: () => {},
        success: () => {},
      },
    });

    assert.equal(
      templatePackageOptions.name,
      "@mymarina/template-finance-admin",
    );
    assert.equal(templatePackageOptions.version, "1.2.3");
    assert.equal(templatePackageOptions.cliHome, path.join(cwd, ".marina-cli"));
    assert.equal(
      await fs.pathExists(path.join(cwd, "finance-app", "package.json")),
      true,
    );
  } finally {
    process.chdir(previousCwd);
  }
});
