export type GyraLogoVariant = "holiday" | "standard";

/**
 * Active site-wide Gyra brand emblem.
 * Set to "holiday" temporarily for the festive season; switch to "standard" next year
 * (or preview either anytime via ?logo=standard / ?logo=holiday).
 */
export const ACTIVE_LOGO_VARIANT: GyraLogoVariant = "holiday";

export const GYRA_LOGO_ASSETS: Record<GyraLogoVariant, string> = {
  holiday: "/gyra-logo-holiday.jpg",
  standard: "/gyra-logo-standard.jpg",
};

export interface ConstellationNode {
  id: string;
  x: number;
  y: number;
  r: number;
  delaySec: number;
}

export interface ConstellationLink {
  id: string;
  from: string;
  to: string;
  durationSec: number;
  delaySec: number;
}

export interface LogoConstellationMap {
  nodes: readonly ConstellationNode[];
  links: readonly ConstellationLink[];
}

/**
 * Precision 0..100 coordinates mapped directly inside the hollow inner cavity of the letter G
 * for each logo asset so animated synaptic filaments attach cleanly node-to-node inside the G.
 */
const HOLIDAY_CONSTELLATION: LogoConstellationMap = {
  nodes: [
    { id: "n0", x: 49.5, y: 41.0, r: 1.5, delaySec: 0.0 },
    { id: "n1", x: 42.8, y: 44.5, r: 1.35, delaySec: 0.4 },
    { id: "n2", x: 56.2, y: 46.0, r: 1.35, delaySec: 0.9 },
    { id: "n3", x: 50.0, y: 49.4, r: 1.55, delaySec: 1.3 },
    { id: "n4", x: 36.8, y: 49.6, r: 1.3, delaySec: 0.6 },
    { id: "n5", x: 43.2, y: 53.3, r: 1.4, delaySec: 1.7 },
    { id: "n6", x: 40.0, y: 56.4, r: 1.5, delaySec: 2.1 },
    { id: "n7", x: 36.5, y: 60.8, r: 1.25, delaySec: 2.5 },
    { id: "n8", x: 44.4, y: 63.9, r: 1.55, delaySec: 1.1 },
    { id: "n9", x: 52.1, y: 66.2, r: 1.5, delaySec: 2.9 },
    { id: "n10", x: 43.2, y: 70.0, r: 1.25, delaySec: 3.3 },
    { id: "n11", x: 51.8, y: 72.3, r: 1.3, delaySec: 1.9 },
    { id: "n12", x: 58.0, y: 69.8, r: 1.35, delaySec: 2.4 },
    { id: "n13", x: 61.4, y: 63.6, r: 1.25, delaySec: 3.6 },
  ],
  links: [
    { id: "l0", from: "n0", to: "n1", durationSec: 3.8, delaySec: 0.0 },
    { id: "l1", from: "n0", to: "n2", durationSec: 4.2, delaySec: 0.5 },
    { id: "l2", from: "n1", to: "n3", durationSec: 3.6, delaySec: 0.9 },
    { id: "l3", from: "n2", to: "n3", durationSec: 4.0, delaySec: 1.4 },
    { id: "l4", from: "n1", to: "n4", durationSec: 4.4, delaySec: 0.3 },
    { id: "l5", from: "n4", to: "n5", durationSec: 3.9, delaySec: 1.1 },
    { id: "l6", from: "n3", to: "n5", durationSec: 3.7, delaySec: 1.8 },
    { id: "l7", from: "n5", to: "n6", durationSec: 4.1, delaySec: 2.2 },
    { id: "l8", from: "n6", to: "n7", durationSec: 4.5, delaySec: 0.7 },
    { id: "l9", from: "n6", to: "n8", durationSec: 3.8, delaySec: 1.5 },
    { id: "l10", from: "n7", to: "n8", durationSec: 4.3, delaySec: 2.6 },
    { id: "l11", from: "n8", to: "n9", durationSec: 3.6, delaySec: 2.0 },
    { id: "l12", from: "n8", to: "n10", durationSec: 4.1, delaySec: 3.0 },
    { id: "l13", from: "n9", to: "n11", durationSec: 3.9, delaySec: 1.2 },
    { id: "l14", from: "n9", to: "n12", durationSec: 4.2, delaySec: 2.4 },
    { id: "l15", from: "n12", to: "n13", durationSec: 4.0, delaySec: 3.2 },
    { id: "l16", from: "n10", to: "n11", durationSec: 4.4, delaySec: 0.6 },
  ],
};

const STANDARD_CONSTELLATION: LogoConstellationMap = {
  nodes: [
    { id: "n0", x: 50.8, y: 32.4, r: 1.55, delaySec: 0.0 },
    { id: "n1", x: 43.4, y: 36.2, r: 1.4, delaySec: 0.4 },
    { id: "n2", x: 58.0, y: 37.8, r: 1.4, delaySec: 0.9 },
    { id: "n3", x: 51.0, y: 41.8, r: 1.6, delaySec: 1.3 },
    { id: "n4", x: 37.2, y: 42.6, r: 1.35, delaySec: 0.6 },
    { id: "n5", x: 43.6, y: 46.6, r: 1.45, delaySec: 1.7 },
    { id: "n6", x: 39.8, y: 50.4, r: 1.55, delaySec: 2.1 },
    { id: "n7", x: 36.0, y: 55.4, r: 1.3, delaySec: 2.5 },
    { id: "n8", x: 44.2, y: 59.0, r: 1.6, delaySec: 1.1 },
    { id: "n9", x: 52.6, y: 62.2, r: 1.55, delaySec: 2.9 },
    { id: "n10", x: 42.4, y: 66.5, r: 1.3, delaySec: 3.3 },
    { id: "n11", x: 51.8, y: 69.4, r: 1.35, delaySec: 1.9 },
    { id: "n12", x: 59.0, y: 66.4, r: 1.4, delaySec: 2.4 },
    { id: "n13", x: 62.4, y: 58.6, r: 1.3, delaySec: 3.6 },
  ],
  links: HOLIDAY_CONSTELLATION.links,
};

export function resolveActiveLogoVariant(search?: string): GyraLogoVariant {
  const query =
    search !== undefined
      ? search
      : typeof window !== "undefined"
        ? window.location.search
        : "";
  if (query) {
    const params = new URLSearchParams(query);
    const override = params.get("logo");
    if (override === "standard" || override === "holiday") {
      return override;
    }
  }
  return ACTIVE_LOGO_VARIANT;
}

export function getGyraLogoSrc(variant: GyraLogoVariant): string {
  return GYRA_LOGO_ASSETS[variant];
}

export function getLogoConstellation(variant: GyraLogoVariant): LogoConstellationMap {
  return variant === "standard" ? STANDARD_CONSTELLATION : HOLIDAY_CONSTELLATION;
}
