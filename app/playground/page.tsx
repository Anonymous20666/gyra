"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlaygroundWorkspace } from "../dev-platform/components/playground/PlaygroundWorkspace";
import {
  DevShell,
  type DataSourceMode,
} from "../dev-platform/components/shell/DevShell";
import { DocsReferenceModal } from "../dev-platform/components/shell/DocsReferenceModal";
import {
  consumePlaygroundHandoff,
  type PlaygroundHandoff,
} from "../dev-platform/handoff";
import {
  GYRA_ENDPOINTS,
  type ApiCategoryId,
} from "../dev-platform/lib/gyraCatalog";

export default function PlaygroundPage() {
  const router = useRouter();
  const [dataMode, setDataMode] = useState<DataSourceMode>("live");
  const [docsOpen, setDocsOpen] = useState(false);
  const [handoff, setHandoff] = useState<PlaygroundHandoff | null>(null);
  const [initialEndpointId, setInitialEndpointId] = useState<string | undefined>(undefined);
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    const stored = consumePlaygroundHandoff();
    const params = new URLSearchParams(window.location.search);
    const epParam = params.get("endpoint") || undefined;
    const catParam = (params.get("category") as ApiCategoryId | null) || undefined;

    if (stored) {
      setHandoff(stored);
      if (stored.endpointPath) {
        const matched = GYRA_ENDPOINTS.find((e) => e.path === stored.endpointPath);
        if (matched) setInitialEndpointId(matched.id);
      }
      setMountKey((k) => k + 1);
    } else if (epParam || catParam) {
      if (epParam) setInitialEndpointId(epParam);
      if (catParam) setHandoff({ category: catParam });
      setMountKey((k) => k + 1);
    }
  }, []);

  return (
    <>
      <DevShell
        route="playground"
        consoleSection="overview"
        dataMode={dataMode}
        activeKeyCount={0}
        onNavigateRoute={(r) => {
          if (r === "console") router.push("/console");
        }}
        onSelectConsoleSection={() => router.push("/console")}
        onChangeDataMode={(mode) => {
          setDataMode(mode);
          router.push("/console");
        }}
        onOpenDocs={() => setDocsOpen(true)}
      >
        <PlaygroundWorkspace
          key={mountKey}
          apiBaseUrl=""
          initialCategory={handoff?.category}
          initialEndpointId={initialEndpointId}
          initialRequestBody={handoff?.requestBody}
          initialApiKey={handoff?.apiKey}
          onGoToKeys={() => router.push("/console")}
        />
      </DevShell>

      <DocsReferenceModal
        open={docsOpen}
        onClose={() => setDocsOpen(false)}
        onSelectEndpoint={(ep) => {
          setDocsOpen(false);
          setInitialEndpointId(ep.id);
          setHandoff(null);
          setMountKey((k) => k + 1);
        }}
      />
    </>
  );
}
