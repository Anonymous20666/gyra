export const AGENT_MODES = [
  "build",
  "plan",
  "debug",
  "explain",
  "refactor",
  "test",
  "review",
  "document",
  "optimize",
  "migrate",
  "design",
  "ship",
] as const;

export type AgentMode = (typeof AGENT_MODES)[number];

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: FileNode[];
}

export interface ToolCallView {
  id: string;
  name: string;
  args: Record<string, unknown>;
  state: "running" | "done" | "error";
  result?: string;
  startedAt: number;
  endedAt?: number;
}

export interface PlanStep {
  title: string;
  detail?: string;
  files?: string[];
}

export interface ImplementationPlan {
  goal: string;
  steps: PlanStep[];
  verification: string[];
}

export interface ChatMessageView {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  tools: ToolCallView[];
  plan?: ImplementationPlan | null;
  error?: string | null;
}

export interface TerminalLine {
  id: string;
  kind: "command" | "stdout" | "stderr" | "exit";
  text: string;
}

export interface SandboxInfo {
  sandboxId: string;
  previewUrl: string;
  root: string;
}

export type PanelTab = "agent" | "plan" | "terminal" | "preview";