"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const config = require("../lib/utils/config");

test("config exposes template registry, npm registry, and cache path helpers", () => {
  const previousTemplateRegistry = process.env.MYMARINA_TEMPLATE_REGISTRY_URL;
  const previousNpmRegistry = process.env.MYMARINA_NPM_REGISTRY;

  process.env.MYMARINA_TEMPLATE_REGISTRY_URL =
    "https://example.com/templates.json";
  process.env.MYMARINA_NPM_REGISTRY = "https://registry.example.com/";

  assert.equal(
    config.getTemplateRegistryUrl(),
    "https://example.com/templates.json",
  );
  assert.equal(config.getNpmRegistry(), "https://registry.example.com");
  assert.equal(
    config.getTemplateCachePath("/tmp/.marina-cli"),
    "/tmp/.marina-cli/templates",
  );

  if (previousTemplateRegistry === undefined) {
    delete process.env.MYMARINA_TEMPLATE_REGISTRY_URL;
  } else {
    process.env.MYMARINA_TEMPLATE_REGISTRY_URL = previousTemplateRegistry;
  }

  if (previousNpmRegistry === undefined) {
    delete process.env.MYMARINA_NPM_REGISTRY;
  } else {
    process.env.MYMARINA_NPM_REGISTRY = previousNpmRegistry;
  }
});
