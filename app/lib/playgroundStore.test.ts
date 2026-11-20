import test from "node:test";
import assert from "node:assert/strict";
import {
  addSavedPrompt,
  createExperiment,
  parsePlaygroundState,
  removeExperiment,
  removeSavedPrompt,
  upsertExperiment,
} from "./playgroundStore";

test("parsePlaygroundState safely handles invalid or null storage payloads", () => {
  assert.deepEqual(parsePlaygroundState(null), { experiments: [], savedPrompts: [] });
  assert.deepEqual(parsePlaygroundState("{broken json"), { experiments: [], savedPrompts: [] });
});

test("experiments and saved prompts CRUD operations are immutable and bounded", () => {
  const e1 = createExperiment("chat", "gyra-1.0", "Webhook test", "2026-11-20T10:00:00Z");
  const e2 = createExperiment("image", "fal-ai/flux/dev", "Studio lighting", "2026-11-20T10:05:00Z");

  let list = upsertExperiment([], e1);
  list = upsertExperiment(list, e2);
  assert.equal(list.length, 2);
  assert.equal(list[0].id, e2.id);

  // Upserting existing moves to top without duplicating
  list = upsertExperiment(list, { ...e1, title: "Updated" });
  assert.equal(list.length, 2);
  assert.equal(list[0].title, "Updated");

  list = removeExperiment(list, e2.id);
  assert.equal(list.length, 1);

  let prompts = addSavedPrompt([], {
    title: "API Audit",
    mode: "chat",
    prompt: "Audit this webhook handler",
    modelId: "gyra-1.0",
  });
  assert.equal(prompts.length, 1);
  prompts = removeSavedPrompt(prompts, prompts[0].id);
  assert.equal(prompts.length, 0);
});
