import test from "node:test";
import assert from "node:assert/strict";
import {
  computeRemainingMs,
  formatStudioTimecode,
  getNearestIndex,
  getWrappedDelta,
  stepCarouselMomentum,
  wrapIndexOffset,
} from "./carouselPhysics";

test("wrapIndexOffset and getWrappedDelta wrap cyclic distances cleanly", () => {
  assert.equal(wrapIndexOffset(5.25, 5).toFixed(2), "0.25");
  assert.equal(wrapIndexOffset(-0.5, 5).toFixed(2), "4.50");
  // Shortest distance from offset 4.8 to index 0 on a 5-item wheel is +0.2 (not -4.8)
  assert.ok(Math.abs(getWrappedDelta(0, 4.8, 5) - 0.2) < 1e-6);
  // Shortest distance from offset 0.1 to index 4 on a 5-item wheel is -1.1
  assert.ok(Math.abs(getWrappedDelta(4, 0.1, 5) - -1.1) < 1e-6);
  assert.equal(getNearestIndex(4.7, 5), 0);
  assert.equal(getNearestIndex(2.2, 5), 2);
});

test("stepCarouselMomentum spins freely on strong flick and settles cleanly onto an integer index", () => {
  let state = { offset: 0, velocity: 6.5, targetIndex: null as number | null, settled: false };
  // Step forward in 60fps ticks for up to 4 seconds
  for (let i = 0; i < 240; i++) {
    state = stepCarouselMomentum(state, 1 / 60, 5);
    if (state.settled) break;
  }
  assert.equal(state.settled, true);
  assert.equal(state.velocity, 0);
  assert.equal(Math.abs(state.offset - Math.round(state.offset)) < 1e-4, true);
});

test("stepCarouselMomentum moves directly to an explicit targetIndex and settles", () => {
  let state = { offset: 0, velocity: 0, targetIndex: 2 as number | null, settled: false };
  for (let i = 0; i < 180; i++) {
    state = stepCarouselMomentum(state, 1 / 60, 5);
    if (state.settled) break;
  }
  assert.equal(state.settled, true);
  assert.equal(state.offset, 2);
});

test("carousel physics wraps and settles cleanly across expanded 8-image gallery", () => {
  assert.equal(getWrappedDelta(7, 0, 8), -1);
  assert.equal(getWrappedDelta(0, 7, 8), 1);

  let state = { offset: 6.4, velocity: 5.5, targetIndex: null as number | null, settled: false };
  for (let i = 0; i < 240; i++) {
    state = stepCarouselMomentum(state, 1 / 60, 8);
    if (state.settled) break;
  }
  assert.equal(state.settled, true);
  const nearest = getNearestIndex(state.offset, 8);
  assert.ok(nearest >= 0 && nearest < 8);
});

test("computeRemainingMs preserves exact pause duration without negative overflow", () => {
  assert.equal(computeRemainingMs(1000, 4000, 2650), 2350);
  assert.equal(computeRemainingMs(1000, 4000, 7000), 0);
  assert.equal(computeRemainingMs(1000, 4000, 500), 4000);
});

test("formatStudioTimecode formats seconds reliably with tenths", () => {
  assert.equal(formatStudioTimecode(0), "00:00.0");
  assert.equal(formatStudioTimecode(3.46), "00:03.4");
  assert.equal(formatStudioTimecode(65.2), "01:05.2");
  assert.equal(formatStudioTimecode(-5), "00:00.0");
});
