"use strict";

const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs-extra");

const doctor = require("../lib/commands/doctor");

test("doctor command reports environment checks", async () => {
  const cliHome = await fs.mkdtemp(path.join(os.tmpdir(), "mymarina-doctor-"));
  const logs = [];

  const result = await doctor({
    context: {
      cliHome,
      userHome: os.homedir(),
    },
    commandRunner: async (command) => {
      if (command === "npm") {
        return { ok: true, output: "10.0.0" };
      }

      if (command === "git") {
        return { ok: true, output: "git version 2.0.0" };
      }

      return { ok: false, output: "" };
    },
    logger: {
      info: (...args) => logs.push(args.join(" ")),
      success: (...args) => logs.push(args.join(" ")),
      warn: (...args) => logs.push(args.join(" ")),
    },
  });

  assert.equal(
    result.every((item) => item.ok),
    true,
  );
  assert.match(logs.join("\n"), /Node.js/);
  assert.match(logs.join("\n"), /npm/);
  assert.match(logs.join("\n"), /git/);
  assert.match(logs.join("\n"), /template registry/);
  assert.match(logs.join("\n"), /npm registry/);
});

test("doctor command marks missing command as failed", async () => {
  const cliHome = await fs.mkdtemp(path.join(os.tmpdir(), "mymarina-doctor-"));

  const result = await doctor({
    context: {
      cliHome,
      userHome: os.homedir(),
    },
    commandRunner: async (command) => {
      if (command === "npm") {
        return { ok: false, output: "npm not found" };
      }

      return { ok: true, output: "ok" };
    },
    logger: {
      info: () => {},
      success: () => {},
      warn: () => {},
    },
  });

  const npmCheck = result.find((item) => item.name === "npm");

  assert.equal(npmCheck.ok, false);
  assert.equal(npmCheck.detail, "npm not found");
});
