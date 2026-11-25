export type ModelId = "gyra-1.0" | "gyra-super2.0";

export type DashboardMode = "chat" | "agent";

export type ModelOption = {
  id: ModelId;
  name: string;
  shortName: string;
  summary: string;
  capabilityNote: string;
  requiresSuper: boolean;
};

export const GYRA_MODELS: ModelOption[] = [
  {
    id: "gyra-1.0",
    name: "Gyra 1.0",
    shortName: "Gyra 1.0",
    summary: "Fast everyday intelligence for writing, analysis, and code.",
    capabilityNote: "Standard tier · Streaming SSE",
    requiresSuper: false,
  },
  {
    id: "gyra-super2.0",
    name: "SuperGyra 2.0",
    shortName: "SuperGyra 2.0",
    summary: "Deep multi-step reasoning, image creation, and unlimited chats.",
    capabilityNote: "SuperGyra plan · Deep reasoning",
    requiresSuper: true,
  },
];

export type AgentLogEntry = {
  agent: string;
  status: string;
  timestamp: number;
};

export type DashboardMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  imageBase64?: string;
  fileBase64?: string;
  imageUrl?: string;
  fileName?: string;
  sources?: string[];
  agentLogs?: AgentLogEntry[];
  modeUsed?: DashboardMode;
  totalTime?: string;
  createdAt?: string;
  feedback?: "up" | "down" | null;
};

export type ChatRecord = {
  id: string;
  title: string;
  pinned?: boolean;
  created_at?: string;
  updated_at?: string;
  project_id?: string | null;
};

export type ProjectInfo = {
  id: string;
  name: string;
  instructions?: string | null;
};

export type BroadcastItem = {
  id: string;
  title: string;
  message: string;
  created_at?: string;
};

export type SubscriptionState = {
  isSuper: boolean;
  plan: string;
  status: string;
};

export type AttachmentState = {
  imageBase64: string | null;
  imageName: string | null;
  documentText: string | null;
  documentName: string | null;
  moderationStatus: "idle" | "checking" | "valid" | "nsfw";
};

export type ChatGroupKey = "Pinned" | "Today" | "Yesterday" | "Previous 7 Days" | "Older";

export function groupChatsByDate(
  chats: ChatRecord[],
  pinnedIds: string[]
): Array<{ label: ChatGroupKey; items: ChatRecord[] }> {
  const pinnedSet = new Set(pinnedIds);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfSevenDays = startOfToday - 7 * 24 * 60 * 60 * 1000;

  const buckets: Record<ChatGroupKey, ChatRecord[]> = {
    Pinned: [],
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  for (const chat of chats) {
    if (chat.pinned || pinnedSet.has(chat.id)) {
      buckets.Pinned.push(chat);
      continue;
    }
    const rawDate = chat.updated_at || chat.created_at;
    const ts = rawDate ? new Date(rawDate).getTime() : NaN;
    if (Number.isNaN(ts) || ts >= startOfToday) {
      buckets.Today.push(chat);
    } else if (ts >= startOfYesterday) {
      buckets.Yesterday.push(chat);
    } else if (ts >= startOfSevenDays) {
      buckets["Previous 7 Days"].push(chat);
    } else {
      buckets.Older.push(chat);
    }
  }

  const order: ChatGroupKey[] = ["Pinned", "Today", "Yesterday", "Previous 7 Days", "Older"];
  return order
    .filter((key) => buckets[key].length > 0)
    .map((label) => ({ label, items: buckets[label] }));
}

export function extractDomainLabel(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return rawUrl.slice(0, 32);
  }
}

export function sanitizeExternalUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}
