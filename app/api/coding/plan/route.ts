// app/api/coding/plan/route.ts
// Plan system backend. Returns a structured, editable plan. If the model cannot
// be reached, it degrades to a deterministic plan instead of failing.

import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { errorMessage, getSandbox } from "@/app/lib/coding/handle";

export const runtime = "nodejs";
export const maxDuration = 120;

const GROQ_BASE_URL = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
const PLAN_MODEL = process.env.PLAN_MODEL ?? process.env.CODING_MODEL ?? "llama-3.3-70b-versatile";

export interface PlanStep {
  id: string;
  index: number;
  title: string;
  detail: string;
  files: string[];
  risk: "low" | "medium" | "high";
  status: "todo" | "doing" | "done";
}

export interface CodingPlan {
  id: string;
  goal: string;
  strategy: string;
  steps: PlanStep[];
  source: "model" | "fallback";
}

interface PlanBody {
  sandboxId?: string;
  goal?: string;
  context?: string;
}

function stepId(index: number): string {
  return `step-${index + 1}`;
}

/** Reads the project top level so the plan is grounded in real files. */
async function projectSketch(sandboxId?: string): Promise<string> {
  try {
    const sandbox = await getSandbox(sandboxId);
    const options = { cwd: "/home/user", timeoutMs: 20_000 } as Parameters<
      typeof sandbox.commands.run
    >[1];
    const listing = await sandbox.commands.run(
      "ls -A | grep -v -E '^(node_modules|.git|.next|dist|build|out|.turbo|coverage)$' | head -n 40",
      options,
    );
    return (listing.stdout ?? "").trim();
  } catch {
    return "";
  }
}

function fallbackPlan(goal: string, sketch: string): CodingPlan {
  const sentences = goal
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);

  const steps: PlanStep[] = (sentences.length ? sentences : [goal]).map(
    (sentence, index) => ({
      id: stepId(index),
      index,
      title: sentence.slice(0, 90),
      detail: `Work item ${index + 1} derived directly from the request. Refine it before starting.`,
      files: [],
      risk: "low" as const,
      status: "todo" as const,
    }),
  );

  return {
    id: `plan-${Date.now()}`,
    goal,
    strategy: sketch
      ? `Ground every step in the real project. Top-level entries seen: ${sketch
          .split("\n")
          .slice(0, 12)
          .join(", ")}.`
      : "The model was unreachable, so this plan is a literal reading of the request. Review each step before executing.",
    steps,
    source: "fallback",
  };
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return null;
  try {
    return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: PlanBody = {};
  try {
    body = (await request.json()) as PlanBody;
  } catch {
    body = {};
  }

  const goal = (body.goal ?? "").trim();
  if (!goal) {
    return NextResponse.json(
      { ok: false, error: "A goal is required to plan." },
      { status: 400 },
    );
  }

  const sketch = await projectSketch(body.sandboxId);

  const apiKey = process.env.GROQ_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      plan: fallbackPlan(goal, sketch),
      note: "No model key configured; returned a deterministic plan.",
    });
  }

  try {
    const provider = createOpenAI({ baseURL: GROQ_BASE_URL, apiKey });
    const result = await generateText({
      model: provider(PLAN_MODEL),
      temperature: 0.2,
      prompt: [
        "You are the planning layer of a coding agent.",
        "Produce a plan as strict JSON only, no prose, matching this shape:",
        '{"strategy": string, "steps": [{"title": string, "detail": string, "files": string[], "risk": "low"|"medium"|"high"}]}',
        "Rules: 3 to 8 steps, each step independently verifiable, no invented file paths.",
        "",
        `Requested goal: ${goal}`,
        body.context ? `Extra context: ${body.context}` : "",
        sketch ? `Real top-level project entries: ${sketch}` : "Project listing unavailable.",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    const parsed = extractJson(result.text) as
      | {
          strategy?: string;
          steps?: Array<{
            title?: string;
            detail?: string;
            files?: string[];
            risk?: string;
          }>;
        }
      | null;

    if (!parsed?.steps?.length) {
      return NextResponse.json({
        ok: true,
        plan: fallbackPlan(goal, sketch),
        note: "The model reply was not valid plan JSON; returned a deterministic plan.",
      });
    }

    const steps: PlanStep[] = parsed.steps.slice(0, 10).map((step, index) => ({
      id: stepId(index),
      index,
      title: (step.title ?? `Step ${index + 1}`).slice(0, 160),
      detail: step.detail ?? "",
      files: Array.isArray(step.files) ? step.files.filter(Boolean) : [],
      risk:
        step.risk === "high" || step.risk === "medium" ? step.risk : ("low" as const),
      status: "todo" as const,
    }));

    const plan: CodingPlan = {
      id: `plan-${Date.now()}`,
      goal,
      strategy: parsed.strategy ?? "Plan produced from the request and the real project listing.",
      steps,
      source: "model",
    };

    return NextResponse.json({ ok: true, plan });
  } catch (error: unknown) {
    return NextResponse.json({
      ok: true,
      plan: fallbackPlan(goal, sketch),
      note: `The model call failed (${errorMessage(error)}); returned a deterministic plan.`,
    });
  }
}