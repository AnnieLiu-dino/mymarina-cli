"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

test("createContext builds shared CLI context from argv and environment", () => {
  const previousCliHome = process.env.CLI_HOME;
  process.env.CLI_HOME = ".mymarina-test";

  const createContext = require("../lib/core/context");
  const context = createContext(["--debug", "create", "demo"]);

  assert.equal(context.debug, true);
  assert.equal(context.args.debug, true);
  assert.equal(context.args._[0], "create");
  assert.equal(context.args._[1], "demo");
  assert.equal(context.cwd, process.cwd());
  assert.ok(context.userHome);
  assert.ok(context.cliHome.endsWith(".mymarina-test"));

  if (previousCliHome === undefined) {
    delete process.env.CLI_HOME;
  } else {
    process.env.CLI_HOME = previousCliHome;
  }
});
