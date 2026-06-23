"use strict";

const readline = require("readline/promises");

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function askText({ message, defaultValue = "" }) {
  const rl = createInterface();

  try {
    const suffix = defaultValue ? ` (${defaultValue})` : "";
    const answer = await rl.question(`${message}${suffix}: `);
    return answer || defaultValue;
  } finally {
    rl.close();
  }
}

async function askSelect({ message, choices }) {
  if (!choices || !choices.length) {
    throw new Error("choices is required.");
  }

  const rl = createInterface();

  try {
    console.log(message);

    choices.forEach((choice, index) => {
      console.log(`${index + 1}. ${choice.name}`);
    });

    const answer = await rl.question("Select: ");
    const index = Number(answer) - 1;

    if (!Number.isInteger(index) || index < 0 || index >= choices.length) {
      throw new Error("Invalid selection.");
    }

    return choices[index].value;
  } finally {
    rl.close();
  }
}

module.exports = {
  askText,
  askSelect,
};
