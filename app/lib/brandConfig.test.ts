import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVE_LOGO_VARIANT,
  getGyraLogoSrc,
  getLogoConstellation,
  resolveActiveLogoVariant,
} from "./brandConfig";

test("brandConfig defaults to temporary holiday cap logo and supports clean standard switch", () => {
  assert.equal(ACTIVE_LOGO_VARIANT, "holiday");
  assert.equal(resolveActiveLogoVariant(""), "holiday");
  assert.equal(resolveActiveLogoVariant("?logo=standard"), "standard");
  assert.equal(resolveActiveLogoVariant("?logo=holiday"), "holiday");
  assert.equal(resolveActiveLogoVariant("?logo=unknown"), "holiday");

  assert.equal(getGyraLogoSrc("holiday"), "/gyra-logo-holiday.jpg");
  assert.equal(getGyraLogoSrc("standard"), "/gyra-logo-standard.jpg");
});

test("both logo variants expose valid inner G constellation node & link graphs", () => {
  for (const variant of ["holiday", "standard"] as const) {
    const map = getLogoConstellation(variant);
    const ids = new Set(map.nodes.map((n) => n.id));
    assert.ok(map.nodes.length >= 10);
    assert.ok(map.links.length >= 12);
    for (const link of map.links) {
      assert.ok(ids.has(link.from), `missing source node ${link.from}`);
      assert.ok(ids.has(link.to), `missing target node ${link.to}`);
    }
  }
});
