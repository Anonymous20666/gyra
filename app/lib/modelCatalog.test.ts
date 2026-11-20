import test from "node:test";
import assert from "node:assert/strict";
import {
  GYRA_MODEL_CATALOG,
  buildDefaultParamsForModel,
  filterSupportedParams,
  getModelById,
  getModelsForPlaygroundMode,
  validatePromptInput,
} from "./modelCatalog";

test("Playground modes expose only real callable models for each modality", () => {
  const chatModels = getModelsForPlaygroundMode("chat");
  assert.deepEqual(
    chatModels.map((m) => m.id),
    ["gyra-1.0", "gyra-super2.0"],
  );

  const imageModels = getModelsForPlaygroundMode("image");
  assert.deepEqual(
    imageModels.map((m) => m.id),
    ["fal-ai/flux/dev", "fal-ai/flux-pro/v1.1-ultra"],
  );

  const videoModels = getModelsForPlaygroundMode("video");
  assert.deepEqual(
    videoModels.map((m) => m.id),
    ["fal-ai/ltx-video-13b-distilled"],
  );

  // Coming-soon models stay visible in catalog but are excluded from active Playground modes
  const emb = getModelById("gyra-embeddings-v1");
  assert.equal(emb?.availability, "coming-soon");
  assert.ok(GYRA_MODEL_CATALOG.some((m) => m.id === "gyra-embeddings-v1"));
});

test("filterSupportedParams strips parameters unsupported by the selected model", () => {
  const fluxDev = getModelById("fal-ai/flux/dev")!;
  const defaults = buildDefaultParamsForModel(fluxDev);
  assert.equal(defaults.image_size, "square_hd");
  assert.equal(defaults.num_inference_steps, 28);

  const cleaned = filterSupportedParams(fluxDev, {
    image_size: "landscape_16_9",
    raw: true, // only flux-pro ultra supports raw
    aspectRatio: "9:16", // video-only
  });
  assert.deepEqual(cleaned, { image_size: "landscape_16_9" });
});

test("validatePromptInput rejects empty or oversized prompts cleanly", () => {
  assert.equal(validatePromptInput("chat", "   ").ok, false);
  assert.equal(validatePromptInput("video", "x".repeat(2005)).ok, false);
  const ok = validatePromptInput("image", "  Studio architectural photograph  ");
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.clean, "Studio architectural photograph");
});
