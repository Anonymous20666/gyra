import test from "node:test";
import assert from "node:assert/strict";
import {
  PLATFORM_NAV_GROUPS,
  buildBreadcrumbs,
  findActiveNavContext,
  isNavItemActive,
  normalizePathname,
} from "./platformNavigation";

test("PLATFORM_NAV_GROUPS organizes navigation into the 4 core pillars", () => {
  assert.deepEqual(
    PLATFORM_NAV_GROUPS.map((g) => g.id),
    ["workspace", "developers", "resources", "account"],
  );
});

test("normalizePathname strips trailing slashes and query strings", () => {
  assert.equal(normalizePathname("/playground/?mode=video"), "/playground");
  assert.equal(normalizePathname("/"), "/");
  assert.equal(normalizePathname("/docs/media/"), "/docs/media");
});

test("findActiveNavContext resolves exact and nested routes cleanly", () => {
  const pg = findActiveNavContext("/playground");
  assert.equal(pg.group?.id, "workspace");
  assert.equal(pg.item?.id, "playground");

  const docsMedia = findActiveNavContext("/docs/media");
  assert.equal(docsMedia.group?.id, "developers");
  assert.equal(docsMedia.item?.id, "docs");

  assert.equal(isNavItemActive("/api-keys", "/api-keys"), true);
  assert.equal(isNavItemActive("/api", "/api-keys"), false);
});

test("buildBreadcrumbs constructs structured orientation trail", () => {
  const crumbs = buildBreadcrumbs("/playground", "Image Mode");
  assert.deepEqual(
    crumbs.map((c) => c.label),
    ["Gyra", "Workspace", "Playground", "Image Mode"],
  );
  assert.equal(crumbs[2].href, "/playground");
  assert.equal(crumbs[3].href, undefined);
});
