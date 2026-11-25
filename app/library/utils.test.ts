import test from "node:test";
import assert from "node:assert/strict";
import { PROMPT_LIBRARY } from "./data";
import {
  enrichPromptLibrary,
  extractPromptVariables,
  filterPrompts,
  getVariableSegments,
  renderResolvedPrompt,
} from "./utils";

test("extractPromptVariables finds unique bracket placeholders in order", () => {
  const vars = extractPromptVariables(
    "Write a cold email to [person/company] about [topic]. Mention [topic] once."
  );
  assert.equal(vars.length, 2);
  assert.equal(vars[0].rawKey, "person/company");
  assert.equal(vars[0].label, "Recipient or company");
  assert.equal(vars[1].rawKey, "topic");
  assert.equal(vars[1].multiline, false);
});

test("extractPromptVariables marks paste/code fields as multiline", () => {
  const vars = extractPromptVariables("Debug:\n```\n[PASTE CODE]\n```\nError: [PASTE ERROR]");
  assert.equal(vars.length, 2);
  assert.equal(vars[0].multiline, true);
  assert.equal(vars[1].multiline, true);
});

test("renderResolvedPrompt substitutes filled values and preserves unfilled placeholders", () => {
  const template = "Compare [A] and [B] for [USE CASE].";
  const resolved = renderResolvedPrompt(template, {
    a: "PostgreSQL",
    "use case": "SaaS billing",
  });
  assert.equal(resolved, "Compare PostgreSQL and [B] for SaaS billing.");
});

test("getVariableSegments reconstructs the exact original template", () => {
  const all = enrichPromptLibrary(PROMPT_LIBRARY);
  assert.equal(all.length, 20);
  for (const item of all) {
    const joined = getVariableSegments(item.prompt)
      .map((seg) => (seg.type === "text" ? seg.value : seg.token))
      .join("");
    assert.equal(joined, item.prompt);
    assert.ok(item.variables.length >= 1, `Expected variables in ${item.id}`);
  }
});

test("filterPrompts supports category, title, description, content search, and sorting", () => {
  const all = enrichPromptLibrary(PROMPT_LIBRARY);

  const codingOnly = filterPrompts(all, "", "coding", "category");
  assert.equal(codingOnly.length, 4);
  assert.ok(codingOnly.every((p) => p.categoryId === "coding"));

  const regexSearch = filterPrompts(all, "regular expression", null, "category");
  assert.equal(regexSearch.length, 1);
  assert.equal(regexSearch[0].id, "regex");

  const sortedAlpha = filterPrompts(all, "", "writing", "alphabetical");
  assert.equal(sortedAlpha[0].title, "Blog post outline");

  const emptyResult = filterPrompts(all, "nonexistent-xyz-token", null, "category");
  assert.equal(emptyResult.length, 0);
});
