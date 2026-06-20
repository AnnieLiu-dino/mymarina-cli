const axios = require("axios");
const semver = require("semver");

class NPMServer {
  constructor(options = {}) {
    this.registry = "https://registry.npmjs.org";
  }

  async getNpmInfo(npmName, isOriginal = true) {
    if (!npmName) throw new Error("npmName 不能为空");

    const url = `${this.registry.replace(/\/$/, "")}/${npmName}`;

    const response = await axios.get(url);

    if (response.status !== 200) {
      throw new Error(`请求失败：${response.status}`);
    }

    return response.data;
  }

  async getLatestVersion(npmName) {
    const data = await this.getNpmInfo(npmName);

    const latest = data?.["dist-tags"]?.latest;
    if (!latest) throw new Error("没有 latest 版本号");

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
