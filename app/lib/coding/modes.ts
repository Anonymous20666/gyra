import type { AgentMode } from "./types";

export interface ModeConfig {
  label: string;
  hint: string;
  writes: boolean;
  terminal: boolean;
  prompt: string;
}

export const MODES: Record<AgentMode, ModeConfig> = {
  build: {
    label: "Build",
    hint: "Ship the feature end to end",
    writes: true,
    terminal: true,
    prompt: `MODE: BUILD.
You are executing a build. Inspect what already exists, write the complete files, then run them.
Do not stop halfway through a feature. If validation fails, fix it and re-run until it passes.`,
  },
  plan: {
    label: "Plan",
    hint: "Architecture only, no writes",
    writes: false,
    terminal: false,
    prompt: `MODE: PLAN.
You have read-only access. Do NOT modify files and do NOT run commands that change state.
Investigate the codebase, then call propose_plan exactly once with a concrete goal, ordered steps and a verification plan.
After propose_plan succeeds, explain the tradeoffs in two short paragraphs and stop. The human must approve before any code is written.`,
  },
  debug: {
    label: "Debug",
    hint: "Reproduce, isolate, patch, verify",
    writes: true,
    terminal: true,
    prompt: `MODE: DEBUG.
Work like a senior engineer chasing a real bug.
1. Reproduce the failure with a command. 2. Read the actual error text, never guess. 3. Find the smallest correct fix. 4. Re-run the reproduction and confirm it passes.
Report the root cause in one sentence before the fix, and never claim a fix works without a passing run.`,
  },
  explain: {
    label: "Explain",
    hint: "Teach the codebase, no edits",
    writes: false,
    terminal: false,
    prompt: `MODE: EXPLAIN.
You have read-only access. Do not edit anything.
Trace the real call paths and quote small, relevant snippets with file paths. Explain why the code is shaped this way, then name the two places a newcomer would get hurt.`,
  },
  refactor: {
    label: "Refactor",
    hint: "Behaviour-preserving cleanup",
    writes: true,
    terminal: true,
    prompt: `MODE: REFACTOR.
Behaviour must not change. Before editing, record how you will prove equivalence.
Make small, reviewable edits using edit_file rather than rewriting whole files, and run the existing tests or build afterwards. If there are no tests, say so explicitly.`,
  },
  test: {
    label: "Test",
    hint: "Write and run real tests",
    writes: true,
    terminal: true,
    prompt: `MODE: TEST.
Write tests that would fail if the code were wrong — not tests that just re-state the implementation.
Detect the project's existing test runner and match its conventions. Run the suite and paste the real result. Never weaken an assertion to make a test pass.`,
  },
  review: {
    label: "Review",
    hint: "Find real defects, no edits",
    writes: false,
    terminal: true,
    prompt: `MODE: REVIEW.
You have read-only file access but may run non-mutating commands (build, tests, typecheck, lint).
Report only defects you can point at, with file and line. Rank by severity: correctness, security, data loss, then style.
Do not pad the review with praise. If you find nothing serious, say that plainly.`,
  },
  document: {
    label: "Document",
    hint: "Docs from real code",
    writes: true,
    terminal: false,
    prompt: `MODE: DOCUMENT.
Documentation must match the code as it actually is. Read the source before writing about it.
Write for the person who has never seen this repo: what it does, how to run it, the three things that will trip them up. Use real commands and real paths.`,
  },
  optimize: {
    label: "Optimize",
    hint: "Measure before changing",
    writes: true,
    terminal: true,
    prompt: `MODE: OPTIMIZE.
Never optimise without a measurement. Find the actual hotspot first — timing, bundle size, query count, render count.
State the baseline, make one change, re-measure, and report before and after numbers. If you cannot measure it, say the change is unproven.`,
  },
  migrate: {
    label: "Migrate",
    hint: "Upgrades and codemods",
    writes: true,
    terminal: true,
    prompt: `MODE: MIGRATE.
Inspect the installed versions and the lockfile before touching anything. Preserve the lockfile's integrity.
Migrate in dependency order, one layer at a time, running the build between layers. List every breaking change you had to handle, and anything you deliberately left behind.`,
  },
  design: {
    label: "Design",
    hint: "UI, layout and motion",
    writes: true,
    terminal: true,
    prompt: `MODE: DESIGN.
Match the existing design language before inventing. Read the neighbouring components and reuse their spacing, colour tokens and radius scale.
Every layout must survive a 375px viewport. Build real states: empty, loading, error, and long content. No placeholder lorem ipsum in the final code.`,
  },
  ship: {
    label: "Ship",
    hint: "Pre-flight and release",
    writes: true,
    terminal: true,
    prompt: `MODE: SHIP.
Run the release pre-flight: install check, typecheck, lint, build. Fix what fails rather than disabling the check.
Then summarise exactly what is deployable, what remains broken, and the one risk most likely to bite in production.`,
  },
};

export function modeConfig(mode: string | undefined): ModeConfig {
  const key = (mode ?? "build") as AgentMode;
  return MODES[key] ?? MODES.build;
}