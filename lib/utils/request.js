"use strict";

const axios = require("axios");

async function request(options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const { url } = options;

  if (!url) {
    throw new Error("request url is required.");
  }

  try {
    const response = await axios({
      url,
      method,
      data: options.data,
      params: options.params,
      headers: options.headers,
      adapter: options.adapter,
      timeout: options.timeout || 10000,
      validateStatus: (status) => status >= 200 && status < 300,
    });

    return response.data;
  } catch (e) {
    if (e.response) {
      throw new Error(`Request failed: ${method} ${url} ${e.response.status}`);
    }

    throw new Error(`Request failed: ${method} ${url}. ${e.message}`);
  }
}

request.get = function get(url, options = {}) {
  return request({
    ...options,
    url,
    method: "GET",
  });
};

module.exports = request;
