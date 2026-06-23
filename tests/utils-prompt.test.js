"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const prompt = require("../lib/utils/prompt");

test("askText delegates to inquirer input prompt", async () => {
  const calls = [];
  const promptClient = prompt.createPromptClient({
    prompt: async (questions) => {
      calls.push(questions);
      return {
        value: "Demo description",
      };
    },
  });

  const answer = await promptClient.askText({
    message: "Project description",
    defaultValue: "Default description",
  });

  assert.equal(answer, "Demo description");
  assert.deepEqual(calls, [
    [
      {
        type: "input",
        name: "value",
        message: "Project description",
        default: "Default description",
      },
    ],
  ]);
});

test("askSelect delegates to inquirer list prompt", async () => {
  const choices = [
    {
      name: "vue-app - Vue 3 project",
      value: "vue-app",
    },
    {
      name: "react-app - React project",
      value: "react-app",
    },
  ];
  const calls = [];
  const promptClient = prompt.createPromptClient({
    prompt: async (questions) => {
      calls.push(questions);
      return {
        value: "vue-app",
      };
    },
  });

  const answer = await promptClient.askSelect({
    message: "Select a project template",
    choices,
  });

  assert.equal(answer, "vue-app");
  assert.deepEqual(calls, [
    [
      {
        type: "list",
        name: "value",
        message: "Select a project template",
        choices,
      },
    ],
  ]);
});

test("askSelect rejects empty choices before calling inquirer", async () => {
  let called = false;
  const promptClient = prompt.createPromptClient({
    prompt: async () => {
      called = true;
      return {
        value: "vue-app",
      };
    },
  });

  await assert.rejects(
    () =>
      promptClient.askSelect({
        message: "Select a project template",
        choices: [],
      }),
    /choices is required/,
  );
  assert.equal(called, false);
});

test("createTemplateChoice formats registry template for selection", () => {
  const choice = prompt.createTemplateChoice({
    name: "vue-app",
    description: "Vue 3 + Vite project",
    tags: ["vue3", "vite"],
  });

  assert.deepEqual(choice, {
    name: "vue-app - Vue 3 + Vite project [vue3, vite]",
    value: "vue-app",
  });
});

test("loadInquirer reports missing dependency clearly", () => {
  assert.throws(
    () =>
      prompt.loadInquirer(() => {
        const error = new Error("Cannot find module 'inquirer'");
        error.code = "MODULE_NOT_FOUND";
        throw error;
      }),
    /Missing dependency: inquirer. Run npm install before using interactive prompts./,
  );
});
