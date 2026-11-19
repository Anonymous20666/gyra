export interface CarouselPhysicsState {
  /** Continuous floating-point index position across [0, itemCount). */
  offset: number;
  /** Angular/linear velocity in items per second. */
  velocity: number;
  /** Optional explicit target index when user clicks arrows/dots or releases near a card. */
  targetIndex: number | null;
  /** True when velocity & displacement have settled cleanly on an exact item. */
  settled: boolean;
}

/** Wrap any floating offset cleanly into [0, count). */
export function wrapIndexOffset(offset: number, count: number): number {
  if (!Number.isFinite(offset) || count <= 0) return 0;
  return ((offset % count) + count) % count;
}

/** Shortest signed cyclic delta from activeOffset to item index, within [-count/2, count/2]. */
export function getWrappedDelta(index: number, activeOffset: number, count: number): number {
  if (count <= 0) return 0;
  let delta = index - wrapIndexOffset(activeOffset, count);
  const half = count / 2;
  if (delta > half) delta -= count;
  if (delta < -half) delta += count;
  return delta;
}

/** Nearest canonical integer item index in [0, count - 1]. */
export function getNearestIndex(offset: number, count: number): number {
  if (count <= 0) return 0;
  return Math.round(wrapIndexOffset(offset, count)) % count;
}

/**
 * Advance a continuous momentum-spin carousel by dtSec seconds.
 * - Free-spinning phase: applies velocity with smooth exponential friction so flicking
 *   lets cards roll naturally across the deck.
 * - Magnetic settle phase: once speed drops below threshold (or an explicit target is set),
 *   critically damped spring pulls the deck smoothly into dead-center alignment.
 */
export function stepCarouselMomentum(
  state: CarouselPhysicsState,
  dtSec: number,
  itemCount: number,
): CarouselPhysicsState {
  if (itemCount <= 1) {
    return { offset: 0, velocity: 0, targetIndex: null, settled: true };
  }

  const dt = Math.min(Math.max(dtSec, 0), 0.05);
  let { offset, velocity, targetIndex } = state;

  // Explicit target spring (arrow button click, dot selection, or post-flick snap)
  if (targetIndex !== null) {
    const delta = getWrappedDelta(targetIndex, offset, itemCount);
    const stiffness = 62;
    const damping = 14.5;
    const accel = delta * stiffness - velocity * damping;
    velocity += accel * dt;
    offset = wrapIndexOffset(offset + velocity * dt, itemCount);

    const remaining = Math.abs(getWrappedDelta(targetIndex, offset, itemCount));
    if (remaining < 0.002 && Math.abs(velocity) < 0.015) {
      return {
        offset: wrapIndexOffset(targetIndex, itemCount),
        velocity: 0,
        targetIndex: null,
        settled: true,
      };
    }

    return { offset, velocity, targetIndex, settled: false };
  }

  // Free inertia roll after user flicks/spins the deck
  const frictionPerFrame = 0.925;
  const decay = Math.pow(frictionPerFrame, dt * 60);
  velocity *= decay;
  offset = wrapIndexOffset(offset + velocity * dt, itemCount);

  // When momentum slows below glide threshold, engage smooth magnetic snap to nearest card
  if (Math.abs(velocity) < 0.42) {
    const snapIdx = getNearestIndex(offset + velocity * 0.18, itemCount);
    return {
      offset,
      velocity,
      targetIndex: snapIdx,
      settled: false,
    };
  }

  return { offset, velocity, targetIndex: null, settled: false };
}

/**
 * Compute remaining milliseconds for a scheduled timer when paused (e.g. on tab hide),
 * guaranteeing zero negative drift or burst catch-up on visibility return.
 */
export function computeRemainingMs(
  startedAt: number,
  durationMs: number,
  pausedAt: number,
): number {
  if (!Number.isFinite(startedAt) || !Number.isFinite(durationMs) || !Number.isFinite(pausedAt)) {
    return Math.max(0, Number.isFinite(durationMs) ? durationMs : 0);
  }
  const elapsed = Math.max(0, pausedAt - startedAt);
  return Math.max(0, Math.round(durationMs - elapsed));
}

/** Format media playback seconds into precision studio timecode (MM:SS.d). */
export function formatStudioTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00.0";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds - Math.floor(seconds)) * 10);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${tenths}`;
}
