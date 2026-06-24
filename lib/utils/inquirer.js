"use strict";

function loadInquirer(requireInquirer = () => require("inquirer")) {
  try {
    return requireInquirer();
  } catch (e) {
    if (e.code === "MODULE_NOT_FOUND") {
      throw new Error(
        "Missing dependency: inquirer. Run npm install before using interactive prompts.",
      );
    }

    throw e;
  }
}

function createPromptClient(inquirerClient) {
  async function askText({ message, defaultValue = "" }) {
    const answers = await inquirerClient.prompt([
      {
        type: "input",
        name: "value",
        message,
        default: defaultValue,
      },
    ]);

    return answers.value;
  }

  async function askSelect({ message, choices }) {
    if (!choices || !choices.length) {
      throw new Error("choices is required.");
    }

    const answers = await inquirerClient.prompt([
      {
        type: "list",
        name: "value",
        message,
        choices,
      },
    ]);

    return answers.value;
  }

  return {
    askText,
    askSelect,
  };
}

function createTemplateChoice(template) {
  const tags = template.tags?.length ? ` [${template.tags.join(", ")}]` : "";

  return {
    name: `${template.name} - ${template.description}${tags}`,
    value: template.name,
  };
}

function getDefaultPromptClient() {
  return createPromptClient(loadInquirer());
}

async function askText(options) {
  return getDefaultPromptClient().askText(options);
}

async function askSelect(options) {
  return getDefaultPromptClient().askSelect(options);
}

module.exports = {
  askText,
  askSelect,
  loadInquirer,
  createPromptClient,
  createTemplateChoice,
};
