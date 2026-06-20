"use strict";

const consola = require("../utils/consola");

function publish(projectName, options) {
  consola.verbose("publish projectName:", projectName);
  consola.verbose("publish options:", options);
}

module.exports = publish;
