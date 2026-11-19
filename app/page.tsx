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
import { EcosystemRoadmap, LandingFooter } from "./components/landing/EcosystemRoadmap";

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
    <div className="min-h-screen bg-black text-[#F5F5F5] overflow-x-clip selection:bg-[#1F5B7C]/35 selection:text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-[#5B9EC2] focus:bg-black focus:px-4 focus:py-2 focus:font-mono-tech focus:text-[12px] focus:text-white focus:uppercase"
      >
        Skip to main content
      </a>
      <Navbar isAuthenticated={isAuthenticated} />
      <main id="main-content">
        <HeroWorkbench isAuthenticated={isAuthenticated} />
        <ArchitectureBand />
        <ChatShowcase />
        <ImageShowcase />
        <VideoShowcase />
        <CapabilityMatrix />
        <DeveloperQuickstart />
        <EcosystemRoadmap includeFooter={false} />
      </main>
      <LandingFooter />
    </div>
  );
}
