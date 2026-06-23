"use strict";

const semver = require("semver");
const request = require("./request");
const { getNpmRegistry } = require("./config");

class NPMServer {
  constructor(options = {}) {
    this.registry = getNpmRegistry(options.registry);
  }

  getNpmRegistry(registry) {
    return getNpmRegistry(registry || this.registry);
  }

  async getNpmInfo(npmName, isOriginal = true) {
    if (!npmName) throw new Error("npmName is required.");

    const registry = this.getNpmRegistry(
      isOriginal ? undefined : this.registry,
    );
    const url = `${registry}/${encodeURIComponent(npmName).replace("%2F", "/")}`;

    return request.get(url);
  }

  async getLatestVersion(npmName) {
    const data = await this.getNpmInfo(npmName);

    const latest = data?.["dist-tags"]?.latest;
    if (!latest) throw new Error("No latest version found.");

    return latest;
  }

  async getVersions(npmName) {
    const data = await this.getNpmInfo(npmName);
    return data?.versions ? Object.keys(data.versions) : [];
  }

  async getNpmLatestSemverVersion(npmName, currentVersion) {
    const versions = await this.getVersions(npmName);

    return (
      versions
        .filter(semver.valid)
        .filter((v) => semver.gt(v, currentVersion))
        .sort((a, b) => (semver.gt(b, a) ? 1 : -1))[0] || null
    );
  }
}

module.exports = new NPMServer();
