"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { Navbar } from "./components/landing/Navbar";
import { HeroWorkbench } from "./components/landing/HeroWorkbench";
import { ArchitectureBand } from "./components/landing/ArchitectureBand";
import { ChatShowcase } from "./components/landing/ChatShowcase";
import { ImageShowcase } from "./components/landing/ImageShowcase";
import { VideoShowcase } from "./components/landing/VideoShowcase";
import { CapabilityMatrix } from "./components/landing/CapabilityMatrix";
import { DeveloperQuickstart } from "./components/landing/DeveloperQuickstart";
import { EcosystemRoadmap } from "./components/landing/EcosystemRoadmap";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted && data.session) setIsAuthenticated(true);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-[#F5F5F5] overflow-x-clip selection:bg-[#FF3D00]/25 selection:text-white">
      <Navbar isAuthenticated={isAuthenticated} />
      <main>
        <HeroWorkbench isAuthenticated={isAuthenticated} />
        <ArchitectureBand />
        <ChatShowcase />
        <ImageShowcase />
        <VideoShowcase />
        <CapabilityMatrix />
        <DeveloperQuickstart />
        <EcosystemRoadmap />
      </main>
    </div>
  );
}
