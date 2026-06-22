"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const request = require("../lib/utils/request");

test("request.get returns parsed JSON response data", async () => {
  const data = await request.get("https://example.com/templates", {
    adapter: async (config) => ({
      data: { ok: true, url: config.url },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }),
  });

  assert.deepEqual(data, { ok: true, url: "https://example.com/templates" });
});

test("request wraps non-2xx responses with a useful message", async () => {
  await assert.rejects(
    () =>
      request.get("https://example.com/fail", {
        adapter: async (config) => {
          const error = new Error("Request failed with status code 503");
          error.response = {
            status: 503,
            data: "unavailable",
            config,
          };
          throw error;
        },
      }),
    /Request failed: GET https:\/\/example.com\/fail 503/,
  );
});
