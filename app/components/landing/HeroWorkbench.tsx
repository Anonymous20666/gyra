"use client";

import { UnifiedKeyboardDashboardFlow } from "../keyboard-studio/UnifiedKeyboardDashboardFlow";

export interface HeroWorkbenchProps {
  isAuthenticated?: boolean;
  routeBase?: string;
}

export function HeroWorkbench({
  isAuthenticated = false,
  routeBase = "",
}: HeroWorkbenchProps) {
  return (
    <UnifiedKeyboardDashboardFlow
      isAuthenticated={isAuthenticated}
      routeBase={routeBase}
      compactHero={false}
    />
  );
}
