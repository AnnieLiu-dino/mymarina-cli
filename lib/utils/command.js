"use strict";

function resolveExecutable(command, platform = process.platform) {
  if (platform === "win32" && command === "npm") {
    return "npm.cmd";
  }

  return command;
}

module.exports = {
  resolveExecutable,
};
