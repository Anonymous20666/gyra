"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Columns2,
  Cpu,
  Film,
  Image as ImageIcon,
  MessageSquare,
  PanelLeft,
  PanelRight,
  Plus,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { getAccessToken, supabase } from "../../supabase";
import {
  GYRA_MODEL_CATALOG,
  buildDefaultParamsForModel,
  getModelById,
  getModelsForPlaygroundMode,
  type GyraModelSpec,
  type ModelParameterSpec,
  type PlaygroundMode,
} from "../../lib/modelCatalog";
import {
  PLAYGROUND_STORAGE_KEY,
  addSavedPrompt,
  createExperiment,
  parsePlaygroundState,
  removeExperiment,
  removeSavedPrompt,
  upsertExperiment,
  type ChatTurn,
  type ComparisonResultItem,
  type ImageHistoryItem,
  type PlaygroundExperiment,
  type PlaygroundPersistedState,
  type SavedPromptItem,
} from "../../lib/playgroundStore";
import { ChatModeWorkspace } from "./ChatModeWorkspace";
import { ImageModeWorkspace } from "./ImageModeWorkspace";
import { VideoModeWorkspace } from "./VideoModeWorkspace";
import { CompareModeWorkspace, type CompareSlotConfig } from "./CompareModeWorkspace";

const MODES: readonly {
  id: PlaygroundMode;
  label: string;
  shortDesc: string;
  Icon: typeof MessageSquare;
}[] = [
  { id: "chat", label: "Chat", shortDesc: "Streaming LLM inference", Icon: MessageSquare },
  { id: "image", label: "Image", shortDesc: "FLUX text-to-image", Icon: ImageIcon },
  { id: "video", label: "Video", shortDesc: "LTX 720p synthesis", Icon: Film },
  { id: "compare", label: "Compare", shortDesc: "Side-by-side live runs", Icon: Columns2 },
];

function parseModeParam(raw: string | null): PlaygroundMode {
  if (raw === "chat" || raw === "image" || raw === "video" || raw === "compare") return raw;
  return "chat";
}

function formatShortTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function PlaygroundClient() {
  const searchParams = useSearchParams();
  const queryMode = searchParams.get("mode");
  const queryModel = searchParams.get("model");

  const [models, setModels] = useState<readonly GyraModelSpec[]>(GYRA_MODEL_CATALOG);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const [mode, setMode] = useState<PlaygroundMode>(() => parseModeParam(queryMode));
  const [selectedModelId, setSelectedModelId] = useState<string>("gyra-1.0");
  const [paramsByModel, setParamsByModel] = useState<
    Record<string, Record<string, string | number | boolean>>
  >({});

  const [slotA, setSlotA] = useState<CompareSlotConfig>({
    modelId: "gyra-1.0",
    think: false,
    search: false,
  });
  const [slotB, setSlotB] = useState<CompareSlotConfig>({
    modelId: "gyra-1.0",
    think: true,
    search: false,
  });

  const [store, setStore] = useState<PlaygroundPersistedState>({
    experiments: [],
    savedPrompts: [],
  });
  const [storeHydrated, setStoreHydrated] = useState(false);
  const [activeExpId, setActiveExpId] = useState<string | null>(null);

  const [draftPrompt, setDraftPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);
  const [compareResults, setCompareResults] = useState<ComparisonResultItem[]>([]);

  const [lastRunMeta, setLastRunMeta] = useState<{
    latencyMs: number;
    ttftMs: number | null;
    status: string;
  } | null>(null);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/models")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models as GyraModelSpec[]);
        }
      })
      .catch(() => {
        // Fallback to bundled GYRA_MODEL_CATALOG already loaded in state
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getAccessToken().then((token) => {
      if (mounted) {
        setAccessToken(token);
        setAuthLoaded(true);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setAccessToken(session?.access_token ?? null);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      const parsed = parsePlaygroundState(window.localStorage.getItem(PLAYGROUND_STORAGE_KEY));
      setStore(parsed);
    } catch {
      // Ignore storage failures
    } finally {
      setStoreHydrated(true);
    }
  }, []);

  const persistStore = useCallback((next: PlaygroundPersistedState) => {
    setStore(next);
    try {
      window.localStorage.setItem(PLAYGROUND_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Quota or private mode
    }
  }, []);

  useEffect(() => {
    if (queryModel) {
      const found = getModelById(queryModel, models);
      if (found) {
        if (found.category === "image") {
          setMode("image");
          setSelectedModelId(found.id);
          return;
        }
        if (found.category === "video") {
          setMode("video");
          setSelectedModelId(found.id);
          return;
        }
        if (found.category === "chat") {
          setMode(queryMode === "compare" ? "compare" : "chat");
          setSelectedModelId(found.id);
          setSlotA((prev) => ({ ...prev, modelId: found.id }));
          return;
        }
      }
    }
    if (queryMode) {
      setMode(parseModeParam(queryMode));
    }
  }, [queryMode, queryModel, models]);

  const modeModels = useMemo(() => getModelsForPlaygroundMode(mode, models), [mode, models]);
  const chatModels = useMemo(() => getModelsForPlaygroundMode("chat", models), [models]);

  useEffect(() => {
    if (modeModels.length === 0) return;
    if (!modeModels.some((m) => m.id === selectedModelId)) {
      setSelectedModelId(modeModels[0].id);
    }
  }, [modeModels, selectedModelId]);

  const activeModel = useMemo(
    () => modeModels.find((m) => m.id === selectedModelId) ?? modeModels[0] ?? GYRA_MODEL_CATALOG[0],
    [modeModels, selectedModelId],
  );

  const activeParams = useMemo(() => {
    const defaults = buildDefaultParamsForModel(activeModel);
    return { ...defaults, ...(paramsByModel[activeModel.id] ?? {}) };
  }, [activeModel, paramsByModel]);

  const setParamValue = (key: string, value: string | number | boolean) => {
    setParamsByModel((prev) => ({
      ...prev,
      [activeModel.id]: {
        ...buildDefaultParamsForModel(activeModel),
        ...(prev[activeModel.id] ?? {}),
        [key]: value,
      },
    }));
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  const saveCurrentExperiment = useCallback(
    (overrides?: {
      turns?: ChatTurn[];
      images?: ImageHistoryItem[];
      compare?: ComparisonResultItem[];
      titleHint?: string;
    }) => {
      if (!storeHydrated) return;
      const turns = overrides?.turns ?? chatTurns;
      const images = overrides?.images ?? imageHistory;
      const compare = overrides?.compare ?? compareResults;

      const existing = activeExpId
        ? store.experiments.find((e) => e.id === activeExpId)
        : undefined;

      const derivedTitle =
        overrides?.titleHint ||
        existing?.title ||
        turns[0]?.content.slice(0, 42) ||
        images[0]?.prompt.slice(0, 42) ||
        draftPrompt.slice(0, 42) ||
        `New ${mode} experiment`;

      const exp: PlaygroundExperiment = existing
        ? {
            ...existing,
            title: derivedTitle,
            mode,
            modelId: activeModel.id,
            systemPrompt,
            updatedAt: new Date().toISOString(),
            chatTurns: turns,
            imageHistory: images,
            lastComparePrompt: mode === "compare" ? draftPrompt : existing.lastComparePrompt,
            lastCompareResults: compare,
          }
        : {
            ...createExperiment(mode, activeModel.id, derivedTitle),
            systemPrompt,
            chatTurns: turns,
            imageHistory: images,
            lastComparePrompt: mode === "compare" ? draftPrompt : undefined,
            lastCompareResults: compare,
          };

      if (!activeExpId) setActiveExpId(exp.id);
      persistStore({
        ...store,
        experiments: upsertExperiment(store.experiments, exp),
      });
    },
    [
      activeExpId,
      activeModel.id,
      chatTurns,
      compareResults,
      draftPrompt,
      imageHistory,
      mode,
      persistStore,
      store,
      storeHydrated,
      systemPrompt,
    ],
  );

  const handleSwitchMode = (nextMode: PlaygroundMode) => {
    setMode(nextMode);
    setLastRunMeta(null);
    setMobileLeftOpen(false);
    const nextModels = getModelsForPlaygroundMode(nextMode, models);
    if (nextModels[0]) {
      setSelectedModelId(nextModels[0].id);
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("mode", nextMode);
      url.searchParams.delete("model");
      window.history.replaceState({}, "", url.toString());
    } catch {
      // Ignore history API issues
    }
  };

  const handleNewExperiment = () => {
    setActiveExpId(null);
    setDraftPrompt("");
    setChatTurns([]);
    setImageHistory([]);
    setCompareResults([]);
    setLastRunMeta(null);
    setMobileLeftOpen(false);
    showToast("Started a fresh experiment");
  };

  const handleLoadExperiment = (exp: PlaygroundExperiment) => {
    setActiveExpId(exp.id);
    setMode(exp.mode);
    setSelectedModelId(exp.modelId);
    setSystemPrompt(exp.systemPrompt || "");
    setChatTurns(exp.chatTurns || []);
    setImageHistory(exp.imageHistory || []);
    setCompareResults(exp.lastCompareResults || []);
    if (exp.mode === "compare" && exp.lastComparePrompt) {
      setDraftPrompt(exp.lastComparePrompt);
    } else {
      setDraftPrompt("");
    }
    setMobileLeftOpen(false);
  };

  const handleDeleteExperiment = (id: string) => {
    persistStore({
      ...store,
      experiments: removeExperiment(store.experiments, id),
    });
    if (activeExpId === id) setActiveExpId(null);
  };

  const handleSavePrompt = (prompt: string, sys?: string) => {
    const clean = prompt.trim();
    if (!clean) return;
    const title = clean.length > 44 ? `${clean.slice(0, 44)}...` : clean;
    persistStore({
      ...store,
      savedPrompts: addSavedPrompt(store.savedPrompts, {
        title,
        mode,
        prompt: clean,
        systemPrompt: sys,
        modelId: activeModel.id,
      }),
    });
    showToast("Saved prompt to workspace");
  };

  const handleLoadSavedPrompt = (item: SavedPromptItem) => {
    setMode(item.mode);
    setSelectedModelId(item.modelId);
    setDraftPrompt(item.prompt);
    if (item.systemPrompt !== undefined) setSystemPrompt(item.systemPrompt);
    setMobileLeftOpen(false);
    showToast("Loaded saved prompt");
  };

  const handleDeleteSavedPrompt = (id: string) => {
    persistStore({
      ...store,
      savedPrompts: removeSavedPrompt(store.savedPrompts, id),
    });
  };

  const handleTurnsChange = (nextTurns: ChatTurn[]) => {
    setChatTurns(nextTurns);
    if (nextTurns.length > 0) {
      saveCurrentExperiment({ turns: nextTurns });
    }
  };

  const handleImagesChange = (nextImages: ImageHistoryItem[]) => {
    setImageHistory(nextImages);
    if (nextImages.length > 0) {
      saveCurrentExperiment({ images: nextImages });
    }
  };

  const handleCompareChange = (nextCompare: ComparisonResultItem[]) => {
    setCompareResults(nextCompare);
    if (nextCompare.length > 0) {
      saveCurrentExperiment({ compare: nextCompare });
    }
  };

  const handleImageFileUpload = (paramKey: string, file: File | null) => {
    if (!file) {
      setParamValue(paramKey, "");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setParamValue(paramKey, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderParamControl = (param: ModelParameterSpec) => {
    const val = activeParams[param.key];

    if (param.type === "toggle") {
      const checked = Boolean(val);
      return (
        <div
          key={param.key}
          className="flex items-start justify-between gap-3 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06] last:border-b-0"
        >
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-[#0B1220] dark:text-[#F8FAFC]">
              {param.label}
            </p>
            <p className="text-[11px] leading-snug text-[#64748B] dark:text-white/45 mt-0.5">
              {param.description}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={param.label}
            onClick={() => setParamValue(param.key, !checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
              checked
                ? "bg-[#1F5B7C] dark:bg-[#5B9EC2]"
                : "bg-black/[0.14] dark:bg-white/[0.16]"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                checked ? "translate-x-4.5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      );
    }

    if (param.type === "select" && param.options) {
      return (
        <div
          key={param.key}
          className="py-2.5 border-b border-black/[0.06] dark:border-white/[0.06] last:border-b-0 space-y-1.5"
        >
          <label
            htmlFor={`param-${param.key}`}
            className="block text-[12.5px] font-medium text-[#0B1220] dark:text-[#F8FAFC]"
          >
            {param.label}
          </label>
          <select
            id={`param-${param.key}`}
            value={String(val ?? param.defaultValue)}
            onChange={(e) => setParamValue(param.key, e.target.value)}
            className="w-full h-8 px-2.5 rounded-md bg-white dark:bg-[#0B1219] border border-black/[0.12] dark:border-white/[0.12] text-[12px] text-[#0B1220] dark:text-[#F8FAFC] focus:outline-none focus:border-[#1F5B7C] dark:focus:border-[#5B9EC2]"
          >
            {param.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] leading-snug text-[#64748B] dark:text-white/45">
            {param.description}
          </p>
        </div>
      );
    }

    if (param.type === "number") {
      const numVal = Number(val ?? param.defaultValue);
      return (
        <div
          key={param.key}
          className="py-2.5 border-b border-black/[0.06] dark:border-white/[0.06] last:border-b-0 space-y-1.5"
        >
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={`param-${param.key}`}
              className="text-[12.5px] font-medium text-[#0B1220] dark:text-[#F8FAFC]"
            >
              {param.label}
            </label>
            <span className="text-[11.5px] font-mono text-[#1F5B7C] dark:text-[#5B9EC2]">
              {numVal}
            </span>
          </div>
          <input
            id={`param-${param.key}`}
            type="range"
            min={param.min ?? 0}
            max={param.max ?? 100}
            step={param.step ?? 1}
            value={numVal}
            onChange={(e) => setParamValue(param.key, Number(e.target.value))}
            className="w-full accent-[#1F5B7C] dark:accent-[#5B9EC2]"
          />
          <p className="text-[11px] leading-snug text-[#64748B] dark:text-white/45">
            {param.description}
          </p>
        </div>
      );
    }

    if (param.type === "image-upload") {
      const currentDataUrl = typeof val === "string" && val.startsWith("data:") ? val : "";
      return (
        <div
          key={param.key}
          className="py-2.5 border-b border-black/[0.06] dark:border-white/[0.06] last:border-b-0 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12.5px] font-medium text-[#0B1220] dark:text-[#F8FAFC]">
              {param.label}
            </span>
            {currentDataUrl && (
              <button
                type="button"
                onClick={() => setParamValue(param.key, "")}
                className="text-[11px] text-[#64748B] hover:text-red-600 dark:text-white/50 dark:hover:text-red-400"
              >
                Clear
              </button>
            )}
          </div>
          {currentDataUrl ? (
            <div className="rounded-md overflow-hidden border border-black/[0.1] dark:border-white/[0.1] bg-black/[0.03] dark:bg-white/[0.03]">
              <img
                src={currentDataUrl}
                alt="Reference frame"
                className="w-full h-24 object-cover"
              />
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 h-9 px-3 rounded-md border border-dashed border-black/[0.16] dark:border-white/[0.16] text-[12px] text-[#475569] dark:text-white/60 hover:border-[#1F5B7C] dark:hover:border-[#5B9EC2] cursor-pointer transition-colors">
              <Upload className="h-3.5 w-3.5" />
              <span>Attach image</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleImageFileUpload(param.key, e.target.files?.[0] ?? null)}
              />
            </label>
          )}
          <p className="text-[11px] leading-snug text-[#64748B] dark:text-white/45">
            {param.description}
          </p>
        </div>
      );
    }

    return null;
  };

  const renderLeftPanelBody = () => (
    <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-[#050A10]">
      <div className="p-3 border-b border-black/[0.08] dark:border-white/[0.08] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#64748B] dark:text-white/45">
            Playground Mode
          </span>
          <button
            type="button"
            onClick={handleNewExperiment}
            className="inline-flex items-center gap-1 h-6 px-2 rounded text-[11.5px] font-medium text-[#1F5B7C] dark:text-[#5B9EC2] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5" role="tablist" aria-label="Playground modes">
          {MODES.map(({ id, label, Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleSwitchMode(id)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-left text-[12.5px] font-medium border transition-colors ${
                  active
                    ? "bg-white dark:bg-[#0D1620] text-[#0B1220] dark:text-white border-[#1F5B7C]/40 dark:border-[#5B9EC2]/45 shadow-xs"
                    : "bg-transparent text-[#475569] dark:text-white/60 border-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    active ? "text-[#1F5B7C] dark:text-[#5B9EC2]" : ""
                  }`}
                />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-black/[0.07] dark:divide-white/[0.07]">
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#64748B] dark:text-white/45">
              Recent Experiments
            </span>
            <span className="text-[10.5px] font-mono text-[#64748B] dark:text-white/40">
              {store.experiments.length}
            </span>
          </div>

          {store.experiments.length === 0 ? (
            <p className="text-[12px] text-[#64748B] dark:text-white/45 py-2 leading-relaxed">
              Submitted chats, renders, and comparisons are saved locally here for quick recall.
            </p>
          ) : (
            <ul className="space-y-1">
              {store.experiments.slice(0, 12).map((exp) => {
                const isActive = exp.id === activeExpId;
                return (
                  <li
                    key={exp.id}
                    className={`group flex items-center justify-between gap-1.5 rounded-md px-2 py-1.5 transition-colors ${
                      isActive
                        ? "bg-[#1F5B7C]/10 dark:bg-[#5B9EC2]/14 text-[#0B1220] dark:text-white"
                        : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-[#334155] dark:text-white/75"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadExperiment(exp)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-[12px] font-medium truncate">{exp.title}</p>
                      <p className="text-[10.5px] font-mono text-[#64748B] dark:text-white/40 uppercase">
                        {exp.mode} · {formatShortTime(exp.updatedAt)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteExperiment(exp.id)}
                      aria-label={`Delete experiment ${exp.title}`}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-[#64748B] hover:text-red-600 dark:text-white/40 dark:hover:text-red-400 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#64748B] dark:text-white/45">
              Saved Prompts
            </span>
            <span className="text-[10.5px] font-mono text-[#64748B] dark:text-white/40">
              {store.savedPrompts.length}
            </span>
          </div>

          {store.savedPrompts.length === 0 ? (
            <p className="text-[12px] text-[#64748B] dark:text-white/45 py-2 leading-relaxed">
              Bookmark any prompt from the editor to reuse it across models.
            </p>
          ) : (
            <ul className="space-y-1">
              {store.savedPrompts.slice(0, 15).map((item) => (
                <li
                  key={item.id}
                  className="group flex items-center justify-between gap-1.5 rounded-md px-2 py-1.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                >
                  <button
                    type="button"
                    onClick={() => handleLoadSavedPrompt(item)}
                    className="min-w-0 flex-1 text-left flex items-start gap-2"
                  >
                    <Bookmark className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#1F5B7C] dark:text-[#5B9EC2]" />
                    <div className="min-w-0">
                      <p className="text-[12px] text-[#0B1220] dark:text-[#F8FAFC] truncate">
                        {item.title}
                      </p>
                      <p className="text-[10.5px] font-mono uppercase text-[#64748B] dark:text-white/40">
                        {item.mode}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSavedPrompt(item.id)}
                    aria-label={`Delete saved prompt ${item.title}`}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-[#64748B] hover:text-red-600 dark:text-white/40 dark:hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-[#64748B] dark:text-white/45">
        <span>{authLoaded && accessToken ? "Authenticated session" : "Guest session"}</span>
        <Link
          href="/models"
          className="text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline font-medium"
        >
          All Models
        </Link>
      </div>
    </div>
  );

  const renderRightPanelBody = () => (
    <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-[#050A10] overflow-y-auto">
      {mode === "compare" ? (
        <div className="p-4 space-y-5">
          <div>
            <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748B] dark:text-white/45">
              Comparison Slots
            </h2>
            <p className="text-[12px] text-[#475569] dark:text-white/60 mt-1 leading-relaxed">
              Both lanes stream concurrently against <code className="font-mono text-[11px]">/api/chat</code> with live latency timing.
            </p>
          </div>

          {(
            [
              { key: "A", label: "Slot A", cfg: slotA, setCfg: setSlotA },
              { key: "B", label: "Slot B", cfg: slotB, setCfg: setSlotB },
            ] as const
          ).map(({ key, label, cfg, setCfg }) => (
            <div
              key={key}
              className="p-3 rounded-lg bg-white dark:bg-[#081018] border border-black/[0.08] dark:border-white/[0.08] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-[0.12em] font-semibold text-[#1F5B7C] dark:text-[#5B9EC2]">
                  {label}
                </span>
                <span className="text-[11px] font-mono text-[#64748B] dark:text-white/40">
                  /api/chat
                </span>
              </div>
              <select
                aria-label={`${label} model`}
                value={cfg.modelId}
                onChange={(e) => setCfg({ ...cfg, modelId: e.target.value })}
                className="w-full h-8 px-2.5 rounded-md bg-[#F8FAFC] dark:bg-[#04080D] border border-black/[0.12] dark:border-white/[0.12] text-[12px] text-[#0B1220] dark:text-[#F8FAFC]"
              >
                {chatModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.availability === "supergyra" ? "(SuperGyra)" : ""}
                  </option>
                ))}
              </select>
              <label className="flex items-center justify-between text-[12px] cursor-pointer">
                <span className="text-[#334155] dark:text-white/75">Reasoning Mode</span>
                <input
                  type="checkbox"
                  checked={cfg.think}
                  onChange={(e) => setCfg({ ...cfg, think: e.target.checked })}
                  className="accent-[#1F5B7C] dark:accent-[#5B9EC2]"
                />
              </label>
              <label className="flex items-center justify-between text-[12px] cursor-pointer">
                <span className="text-[#334155] dark:text-white/75">Web Search</span>
                <input
                  type="checkbox"
                  checked={cfg.search}
                  onChange={(e) => setCfg({ ...cfg, search: e.target.checked })}
                  className="accent-[#1F5B7C] dark:accent-[#5B9EC2]"
                />
              </label>
            </div>
          ))}

          <div className="space-y-1.5">
            <label
              htmlFor="compare-system-prompt"
              className="block text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748B] dark:text-white/45"
            >
              Shared System Prompt
            </label>
            <textarea
              id="compare-system-prompt"
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Optional system instruction applied to both lanes..."
              className="w-full rounded-md p-2.5 bg-white dark:bg-[#081018] border border-black/[0.1] dark:border-white/[0.1] text-[12px] text-[#0B1220] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-white/30 focus:outline-none focus:border-[#1F5B7C] dark:focus:border-[#5B9EC2]"
            />
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="playground-model-select"
              className="block text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748B] dark:text-white/45"
            >
              Model
            </label>
            <select
              id="playground-model-select"
              value={activeModel.id}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full h-9 px-2.5 rounded-md bg-white dark:bg-[#081018] border border-black/[0.12] dark:border-white/[0.12] text-[12.5px] font-medium text-[#0B1220] dark:text-[#F8FAFC] focus:outline-none focus:border-[#1F5B7C] dark:focus:border-[#5B9EC2]"
            >
              {modeModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.availability === "supergyra" ? "— SuperGyra" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-lg bg-white dark:bg-[#081018] border border-black/[0.08] dark:border-white/[0.08] space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#0B1220] dark:text-[#F8FAFC] truncate">
                  {activeModel.name}
                </p>
                <p className="text-[11px] font-mono text-[#64748B] dark:text-white/45 truncate">
                  {activeModel.provider}
                </p>
              </div>
              <span
                className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-[0.08em] border ${
                  activeModel.availability === "available"
                    ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/8"
                    : "border-[#1F5B7C]/35 text-[#1F5B7C] dark:text-[#5B9EC2] bg-[#1F5B7C]/8"
                }`}
              >
                {activeModel.availability === "supergyra" ? "SuperGyra" : "Available"}
              </span>
            </div>

            <p className="text-[12px] leading-relaxed text-[#475569] dark:text-white/65">
              {activeModel.description}
            </p>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06] text-[11px]">
              <div>
                <dt className="text-[#64748B] dark:text-white/40">Endpoint</dt>
                <dd className="font-mono text-[#0B1220] dark:text-white/85 truncate">
                  {activeModel.endpoint}
                </dd>
              </div>
              <div>
                <dt className="text-[#64748B] dark:text-white/40">Limit</dt>
                <dd className="text-[#0B1220] dark:text-white/85 truncate">
                  {activeModel.contextLimit}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[#64748B] dark:text-white/40">Inputs / Outputs</dt>
                <dd className="text-[#0B1220] dark:text-white/85">
                  {activeModel.inputTypes.join(", ")} → {activeModel.outputTypes.join(", ")}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[#64748B] dark:text-white/40">Access & Billing</dt>
                <dd className="text-[#0B1220] dark:text-white/85">{activeModel.pricingSummary}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748B] dark:text-white/45">
                Parameters
              </h3>
              <span className="text-[10.5px] font-mono text-[#64748B] dark:text-white/40">
                {activeModel.parameters.length} supported
              </span>
            </div>

            {activeModel.parameters.length === 0 ? (
              <p className="text-[12px] text-[#64748B] dark:text-white/45 py-2">
                This model uses fixed backend parameters with no client-side overrides.
              </p>
            ) : (
              <div>{activeModel.parameters.map(renderParamControl)}</div>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto p-4 border-t border-black/[0.08] dark:border-white/[0.08] space-y-2">
        <span className="block text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#64748B] dark:text-white/45">
          Last Execution
        </span>
        {lastRunMeta ? (
          <dl className="grid grid-cols-2 gap-2 text-[11.5px]">
            <div>
              <dt className="text-[#64748B] dark:text-white/40">Status</dt>
              <dd className="font-medium text-[#0B1220] dark:text-[#F8FAFC] truncate">
                {lastRunMeta.status}
              </dd>
            </div>
            <div>
              <dt className="text-[#64748B] dark:text-white/40">Total Time</dt>
              <dd className="font-mono text-[#0B1220] dark:text-[#F8FAFC]">
                {lastRunMeta.latencyMs} ms
              </dd>
            </div>
            {lastRunMeta.ttftMs !== null && (
              <div>
                <dt className="text-[#64748B] dark:text-white/40">TTFT</dt>
                <dd className="font-mono text-[#0B1220] dark:text-[#F8FAFC]">
                  {lastRunMeta.ttftMs} ms
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-[11.5px] text-[#64748B] dark:text-white/45">
            Run a prompt to inspect real request timing and execution status.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 min-h-0 h-full w-full overflow-hidden relative">
      {leftOpen && (
        <aside
          aria-label="Playground workspace navigation"
          className="hidden xl:flex w-[264px] shrink-0 border-r border-black/[0.08] dark:border-white/[0.08] flex-col min-h-0"
        >
          {renderLeftPanelBody()}
        </aside>
      )}

      <section className="flex-1 min-w-0 flex flex-col min-h-0 bg-white dark:bg-[#03060A]">
        <div className="h-11 px-3 sm:px-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between gap-2 shrink-0 bg-[#F8FAFC]/80 dark:bg-[#050A10]/80">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth >= 1280) {
                  setLeftOpen((v) => !v);
                } else {
                  setMobileLeftOpen(true);
                }
              }}
              aria-label="Toggle workspace panel"
              className="h-7 px-2 inline-flex items-center gap-1.5 rounded border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#0B1219] text-[12px] text-[#334155] dark:text-white/75 hover:border-[#1F5B7C] dark:hover:border-[#5B9EC2] transition-colors"
            >
              <PanelLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sessions</span>
            </button>

            <div className="flex items-center gap-1.5 text-[12px] text-[#475569] dark:text-white/65 min-w-0">
              <Cpu className="h-3.5 w-3.5 shrink-0 text-[#1F5B7C] dark:text-[#5B9EC2]" />
              <span className="font-medium text-[#0B1220] dark:text-[#F8FAFC] truncate">
                {mode === "compare"
                  ? `${slotA.modelId} vs ${slotB.modelId}`
                  : activeModel.name}
              </span>
              <span className="hidden md:inline text-[11px] font-mono text-[#64748B] dark:text-white/40 uppercase">
                · {mode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {toastMsg && (
              <span className="hidden sm:inline text-[11.5px] font-medium text-[#1F5B7C] dark:text-[#5B9EC2]">
                {toastMsg}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setRightOpen((v) => !v);
                } else {
                  setMobileRightOpen(true);
                }
              }}
              aria-label="Toggle configuration panel"
              className="h-7 px-2 inline-flex items-center gap-1.5 rounded border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#0B1219] text-[12px] text-[#334155] dark:text-white/75 hover:border-[#1F5B7C] dark:hover:border-[#5B9EC2] transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Config</span>
              <PanelRight className="h-3.5 w-3.5 hidden lg:inline" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {mode === "chat" && (
            <ChatModeWorkspace
              model={activeModel}
              params={activeParams}
              systemPrompt={systemPrompt}
              onChangeSystemPrompt={setSystemPrompt}
              turns={chatTurns}
              onChangeTurns={handleTurnsChange}
              draftPrompt={draftPrompt}
              onChangeDraftPrompt={setDraftPrompt}
              onSavePrompt={(p, s) => handleSavePrompt(p, s)}
              onRunMeta={setLastRunMeta}
              accessToken={accessToken}
            />
          )}

          {mode === "image" && (
            <ImageModeWorkspace
              model={activeModel}
              params={activeParams}
              draftPrompt={draftPrompt}
              onChangeDraftPrompt={setDraftPrompt}
              history={imageHistory}
              onChangeHistory={handleImagesChange}
              onSavePrompt={(p) => handleSavePrompt(p)}
              onRunMeta={setLastRunMeta}
              accessToken={accessToken}
            />
          )}

          {mode === "video" && (
            <VideoModeWorkspace
              model={activeModel}
              params={activeParams}
              draftPrompt={draftPrompt}
              onChangeDraftPrompt={setDraftPrompt}
              onSavePrompt={(p) => handleSavePrompt(p)}
              onRunMeta={setLastRunMeta}
              accessToken={accessToken}
            />
          )}

          {mode === "compare" && (
            <CompareModeWorkspace
              chatModels={chatModels}
              slotA={slotA}
              slotB={slotB}
              systemPrompt={systemPrompt}
              draftPrompt={draftPrompt}
              onChangeDraftPrompt={setDraftPrompt}
              results={compareResults}
              onChangeResults={handleCompareChange}
              onSavePrompt={(p) => handleSavePrompt(p, systemPrompt)}
              onRunMeta={setLastRunMeta}
              accessToken={accessToken}
            />
          )}
        </div>
      </section>

      {rightOpen && (
        <aside
          aria-label="Model configuration"
          className="hidden lg:flex w-[308px] shrink-0 border-l border-black/[0.08] dark:border-white/[0.08] flex-col min-h-0"
        >
          {renderRightPanelBody()}
        </aside>
      )}

      {mobileLeftOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close workspace panel"
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileLeftOpen(false)}
          />
          <div className="relative z-10 w-[290px] max-w-[85vw] h-full border-r border-black/[0.1] dark:border-white/[0.1] flex flex-col bg-[#F8FAFC] dark:bg-[#050A10]">
            <div className="h-11 px-3 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                Playground Workspace
              </span>
              <button
                type="button"
                onClick={() => setMobileLeftOpen(false)}
                aria-label="Close"
                className="p-1 text-[#64748B] dark:text-white/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">{renderLeftPanelBody()}</div>
          </div>
        </div>
      )}

      {mobileRightOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close configuration panel"
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileRightOpen(false)}
          />
          <div className="relative z-10 w-[312px] max-w-[88vw] h-full border-l border-black/[0.1] dark:border-white/[0.1] flex flex-col bg-[#F8FAFC] dark:bg-[#050A10]">
            <div className="h-11 px-3 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                Model Configuration
              </span>
              <button
                type="button"
                onClick={() => setMobileRightOpen(false)}
                aria-label="Close"
                className="p-1 text-[#64748B] dark:text-white/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">{renderRightPanelBody()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
