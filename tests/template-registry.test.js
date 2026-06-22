"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const registry = require("../lib/template/registry");

test("template registry fetches and validates remote template list", async () => {
  const templates = await registry.getTemplateList({
    registryUrl: "https://example.com/templates.json",
    requestClient: {
      get: async (url) => {
        assert.equal(url, "https://example.com/templates.json");
        return [
          {
            name: "finance-admin",
            description: "Finance admin template",
            npmName: "@mymarina/template-finance-admin",
            version: "latest",
            tags: ["vue3", "admin"],
            maintainer: "finance-fe",
          },
        ];
      },
    },
  });

  assert.deepEqual(templates, [
    {
      name: "finance-admin",
      description: "Finance admin template",
      npmName: "@mymarina/template-finance-admin",
      version: "latest",
      tags: ["vue3", "admin"],
      maintainer: "finance-fe",
    },
  ]);
});

test("template registry rejects invalid template records", async () => {
  await assert.rejects(
    () =>
      registry.getTemplateList({
        registryUrl: "https://example.com/templates.json",
        requestClient: {
          get: async () => [
            {
              name: "broken",
              description: "Missing npmName",
              version: "latest",
              tags: ["broken"],
              maintainer: "platform",
            },
          ],
        },
      }),
    /Template record at index 0 is missing required field: npmName/,
  );
});
