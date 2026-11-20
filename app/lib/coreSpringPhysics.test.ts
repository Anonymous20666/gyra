import test from "node:test";
import assert from "node:assert/strict";
import {
  CORE_RETURN_SPRING,
  clampCoreOffset,
  clampRadialOffset,
  clampReleaseVelocity,
  computeCoupledFollowOffset,
  computeMagneticPull,
  computeStretchTension,
  createSpring2D,
  stepSpring2D,
} from "./coreSpringPhysics";

test("clampCoreOffset allows free roaming inside bounds and blocks escaping canvas edges", () => {
  const bounds = { baseX: 560, baseY: 148, width: 1120, height: 535, padding: 44 };
  const free = clampCoreOffset(210, 180, bounds);
  assert.deepEqual(free, { x: 210, y: 180 });

  const clamped = clampCoreOffset(900, -500, bounds);
  assert.equal(clamped.x, 1120 - 44 - 560);
  assert.equal(clamped.y, 44 - 148);
});

test("stepSpring2D elastically returns displaced core back to exact home (0, 0)", () => {
  let spring = { x: 260, y: 190, vx: 120, vy: -80 };
  let settled = false;
  let passedOrigin = false;

  for (let i = 0; i < 240; i++) {
    const res = stepSpring2D(spring, 0, 0, 1 / 60, CORE_RETURN_SPRING);
    spring = res.state;
    if (spring.x < 0) passedOrigin = true;
    if (res.settled) {
      settled = true;
      break;
    }
  }

  assert.equal(settled, true, "Spring should settle back at origin within 4 seconds");
  assert.equal(passedOrigin, true, "Underdamped spring should have a subtle elastic overshoot");
  assert.equal(spring.x, 0);
  assert.equal(spring.y, 0);
  assert.equal(spring.vx, 0);
  assert.equal(spring.vy, 0);
});

test("stepSpring2D stays numerically stable even with coarse dt spikes", () => {
  let spring = createSpring2D(-240, 220);
  for (let i = 0; i < 60; i++) {
    const res = stepSpring2D(spring, 0, 0, 0.05, CORE_RETURN_SPRING);
    spring = res.state;
    assert.ok(Number.isFinite(spring.x) && Number.isFinite(spring.y));
    assert.ok(Math.abs(spring.x) < 400 && Math.abs(spring.y) < 400);
  }
  assert.ok(Math.hypot(spring.x, spring.y) < 2);
});

test("computeMagneticPull attracts smoothly inside radius and zeros outside", () => {
  const inside = computeMagneticPull(120, 100, 100, 100, 80, 6);
  assert.ok(inside.x > 0 && inside.x <= 6);
  assert.equal(inside.y, 0);

  const outside = computeMagneticPull(220, 100, 100, 100, 80, 6);
  assert.deepEqual(outside, { x: 0, y: 0 });
});

test("clampRadialOffset, coupled follow, tension, and velocity clamp stay bounded", () => {
  const radial = clampRadialOffset(100, 0, 28);
  assert.ok(Math.abs(radial.x - 28) < 1e-9);
  assert.equal(radial.y, 0);

  const f = computeCoupledFollowOffset({ x: 100, y: -50 }, 0.14); assert.ok(Math.abs(f.x - 14) < 1e-9 && Math.abs(f.y + 7) < 1e-9);
  assert.equal(computeStretchTension(0, 0, 220), 0);
  assert.equal(computeStretchTension(300, 300, 220), 1);

  const vel = clampReleaseVelocity(3000, 0, 1400);
  assert.ok(Math.abs(vel.x - 1400) < 1e-9);
  assert.equal(vel.y, 0);
});
