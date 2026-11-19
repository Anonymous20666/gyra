"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { ArchitectureBand } from "./components/landing/ArchitectureBand";
import { ChatShowcase } from "./components/landing/ChatShowcase";
import { DeveloperQuickstart } from "./components/landing/DeveloperQuickstart";
import { EcosystemRoadmap } from "./components/landing/EcosystemRoadmap";
import { HeroWorkbench } from "./components/landing/HeroWorkbench";
import { ImageShowcase } from "./components/landing/ImageShowcase";
import { Navbar } from "./components/landing/Navbar";
import { VideoShowcase } from "./components/landing/VideoShowcase";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setIsAuthenticated(Boolean(data.session?.user));
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] text-[#F5F7FA] overflow-x-clip">
      <Navbar isAuthenticated={isAuthenticated} />
      <main>
        <HeroWorkbench />
        <ChatShowcase />
        <ImageShowcase />
        <VideoShowcase />
        <ArchitectureBand />
        <DeveloperQuickstart />
        <EcosystemRoadmap />
      </main>
    </div>
  );
}
