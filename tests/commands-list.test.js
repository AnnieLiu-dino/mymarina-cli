"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const list = require("../lib/commands/list");

test("list command prints template rows", async () => {
  const lines = [];

  await list({
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
    logger: {
      info: (...args) => lines.push(args.join(" ")),
      success: (...args) => lines.push(args.join(" ")),
    },
  });

  assert.match(lines.join("\n"), /finance-admin/);
  assert.match(lines.join("\n"), /@mymarina\/template-finance-admin/);
  assert.match(lines.join("\n"), /vue3, admin/);
});
