"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const npm = require("../lib/utils/npm");

test("npm utility normalizes configured registry URLs", () => {
  assert.equal(npm.getNpmRegistry("https://registry.example.com/"), "https://registry.example.com");
});
