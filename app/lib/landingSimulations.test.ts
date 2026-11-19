import test from "node:test";
import assert from "node:assert/strict";
import { CORE_PRODUCTS, ECOSYSTEM_ITEMS, GYRA_COMPANY, ROADMAP_ITEMS } from "./gyraCatalog";
import {
  API_EXAMPLES,
  ARCHITECTURE_LAYERS,
  CHAT_SCENARIOS,
  IMAGE_EDIT_SHOWCASE,
  IMAGE_PRESETS,
  VIDEO_TEMPLATES,
  clampSplitPercent,
  getNextAgentIndex,
  getTotalPipelineDuration,
  resolveGyraRoute,
} from "./landingSimulations";

test("core catalog exposes all three flagship products cleanly", () => {
  const ids = CORE_PRODUCTS.map((p) => p.id);
  assert.deepEqual(ids, ["chat", "image", "video"]);
  for (const product of CORE_PRODUCTS) {
    assert.ok(product.name.startsWith("Gyra "));
    assert.ok(product.route.startsWith("/"));
    assert.equal(product.specs.length, 3);
  }
});

test("company branding preserves canonical Genvia AI Company ownership and Telegram handle", () => {
  assert.equal(GYRA_COMPANY.parentCompany, "Genvia AI Company");
  assert.equal(GYRA_COMPANY.founder, "Victory Lord");
  const telegramNews = GYRA_COMPANY.socials.find((s) => s.id === "telegram-news");
  assert.equal(telegramNews?.href, "https://t.me/GenviaNews");
});

test("clampSplitPercent enforces valid comparison boundaries", () => {
  assert.equal(clampSplitPercent(50), 50);
  assert.equal(clampSplitPercent(-12), 0);
  assert.equal(clampSplitPercent(145), 100);
  assert.equal(clampSplitPercent(Number.NaN), 50);
  assert.equal(clampSplitPercent(42.7), 43);
});

test("agent pipeline timing and stepping logic are deterministic", () => {
  const webhookScenario = CHAT_SCENARIOS[0];
  assert.equal(webhookScenario.agents.length, 6);
  assert.equal(getTotalPipelineDuration(webhookScenario.agents), 3.4);
  assert.equal(getNextAgentIndex(-1, 6), 0);
  assert.equal(getNextAgentIndex(2, 6), 3);
  assert.equal(getNextAgentIndex(5, 6), 5);
  assert.equal(getNextAgentIndex(0, 0), -1);
});

test("all showcase media references point to local optimized assets", () => {
  assert.ok(IMAGE_EDIT_SHOWCASE.beforeSrc.startsWith("/showcase/"));
  assert.ok(IMAGE_EDIT_SHOWCASE.afterSrc.startsWith("/showcase/"));
  for (const preset of IMAGE_PRESETS) {
    assert.ok(preset.imageSrc.startsWith("/showcase/"));
  }
  for (const tpl of VIDEO_TEMPLATES) {
    assert.ok(tpl.videoSrc.endsWith(".mp4"));
    assert.ok(tpl.posterSrc.endsWith(".jpg"));
  }
});

test("developer API examples cover verified Gyra v1 endpoints in all three languages", () => {
  assert.equal(API_EXAMPLES.length, 3);
  for (const ex of API_EXAMPLES) {
    assert.ok(ex.endpoint.startsWith("/api/v1/"));
    assert.ok(ex.snippets.curl.includes(ex.endpoint));
    assert.ok(ex.snippets.typescript.includes(ex.endpoint));
    assert.ok(ex.snippets.python.includes(ex.endpoint));
  }
});

test("ecosystem, roadmap, and architecture layers contain non-empty structured data", () => {
  assert.equal(ARCHITECTURE_LAYERS.length, 3);
  assert.ok(ECOSYSTEM_ITEMS.length >= 6);
  assert.ok(ROADMAP_ITEMS.length >= 4);
});

test("resolveGyraRoute handles relative, hash, and external URLs safely", () => {
  assert.equal(resolveGyraRoute("/dashboard", "https://gyra.ng"), "https://gyra.ng/dashboard");
  assert.equal(resolveGyraRoute("/dashboard", ""), "/dashboard");
  assert.equal(resolveGyraRoute("#chat", "https://gyra.ng"), "#chat");
  assert.equal(resolveGyraRoute("https://t.me/Gyra_AiBot", "https://gyra.ng"), "https://t.me/Gyra_AiBot");
});
