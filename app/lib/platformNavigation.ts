export type NavGroupId = "workspace" | "developers" | "resources" | "account";

export type NavIconName =
  | "overview"
  | "playground"
  | "models"
  | "chat"
  | "projects"
  | "api"
  | "keys"
  | "docs"
  | "console"
  | "products"
  | "changelog"
  | "status"
  | "support"
  | "account"
  | "credits";

export interface NavSubItem {
  id: string;
  label: string;
  href: string;
  matchQuery?: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: NavIconName;
  group?: NavGroupId;
  description: string;
  children?: NavSubItem[];
}

export interface NavGroup {
  id: NavGroupId;
  label: string;
  items: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const PLATFORM_NAV_GROUPS: readonly NavGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "overview",
        label: "Overview",
        href: "/workspace",
        icon: "overview",
        description: "Workspace summary, recent generations, and quick launch.",
      },
      {
        id: "playground",
        label: "Playground",
        href: "/playground",
        icon: "playground",
        description: "Interactive Chat, Image, Video, and side-by-side Model Comparison.",
        children: [
          { id: "pg-chat", label: "Chat", href: "/playground?mode=chat", matchQuery: "chat" },
          { id: "pg-image", label: "Image", href: "/playground?mode=image", matchQuery: "image" },
          { id: "pg-video", label: "Video", href: "/playground?mode=video", matchQuery: "video" },
          { id: "pg-compare", label: "Compare", href: "/playground?mode=compare", matchQuery: "compare" },
        ],
      },
      {
        id: "models",
        label: "Models",
        href: "/models",
        icon: "models",
        description: "Capabilities, parameters, limits, and availability across Gyra models.",
      },
      {
        id: "chat-app",
        label: "Gyra Chat",
        href: "/dashboard",
        icon: "chat",
        description: "Full-screen conversational assistant and multi-agent chat workspace.",
      },
      {
        id: "projects",
        label: "Projects",
        href: "/projects",
        icon: "projects",
        description: "File-grounded workspaces and shared project folders.",
      },
    ],
  },
  {
    id: "developers",
    label: "Developers",
    items: [
      {
        id: "api",
        label: "API Platform",
        href: "/api",
        icon: "api",
        description: "Endpoints, quickstart, code examples, request history, and usage.",
      },
      {
        id: "api-keys",
        label: "API Keys",
        href: "/api-keys",
        icon: "keys",
        description: "Create, mask, scope, and revoke API credentials.",
      },
      {
        id: "docs",
        label: "Documentation",
        href: "/docs",
        icon: "docs",
        description: "Integration guides, authentication, endpoints, and error schemas.",
        children: [
          { id: "docs-core", label: "Core API Docs", href: "/docs" },
          { id: "docs-media", label: "Media API Docs", href: "/docs/media" },
        ],
      },
      {
        id: "console",
        label: "Console",
        href: "/console",
        icon: "console",
        description: "Developer wallets, scoped keys, and recent API activity.",
      },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    items: [
      {
        id: "products",
        label: "Products",
        href: "/products",
        icon: "products",
        description: "Explore Gyra capabilities across chat, media, and APIs.",
      },
      {
        id: "changelog",
        label: "Changelog",
        href: "/changelog",
        icon: "changelog",
        description: "Platform releases, model additions, and engineering updates.",
      },
      {
        id: "status",
        label: "System Status",
        href: "/status",
        icon: "status",
        description: "Service operational status and platform health.",
      },
      {
        id: "support",
        label: "Help & Support",
        href: "/contact",
        icon: "support",
        description: "Contact Genvia AI Company support and engineering.",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      {
        id: "account",
        label: "Account & Settings",
        href: "/account",
        icon: "account",
        description: "Profile, preferences, usage limits, security, and session.",
      },
      {
        id: "credits",
        label: "Credits & Billing",
        href: "/credits",
        icon: "credits",
        description: "SuperGyra subscription status, wallets, and credit balance.",
      },
    ],
  },
];

export function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const clean = pathname.split("?")[0].split("#")[0];
  if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
  return clean || "/";
}

export function isNavItemActive(itemHref: string, pathname: string): boolean {
  const normPath = normalizePathname(pathname);
  const normHref = normalizePathname(itemHref);
  if (normHref === "/") return normPath === "/";
  return normPath === normHref || normPath.startsWith(`${normHref}/`);
}

export function findActiveNavContext(pathname: string): {
  group: NavGroup | null;
  item: NavItem | null;
} {
  const normPath = normalizePathname(pathname);
  // Check exact matches first, then longest prefix match
  let bestGroup: NavGroup | null = null;
  let bestItem: NavItem | null = null;
  let bestLen = -1;

  for (const group of PLATFORM_NAV_GROUPS) {
    for (const item of group.items) {
      if (isNavItemActive(item.href, normPath)) {
        if (item.href.length > bestLen) {
          bestGroup = group;
          bestItem = item;
          bestLen = item.href.length;
        }
      }
      if (item.children) {
        for (const child of item.children) {
          const childBase = normalizePathname(child.href);
          if (childBase === normPath && childBase.length > bestLen) {
            bestGroup = group;
            bestItem = item;
            bestLen = childBase.length;
          }
        }
      }
    }
  }

  return { group: bestGroup, item: bestItem };
}

export function buildBreadcrumbs(
  pathname: string,
  extraTrail?: string,
): BreadcrumbItem[] {
  const { group, item } = findActiveNavContext(pathname);
  const crumbs: BreadcrumbItem[] = [{ label: "Gyra", href: "/workspace" }];

  if (group) {
    const groupDefaultHref = group.items[0]?.href;
    crumbs.push({ label: group.label, href: groupDefaultHref });
  }
  if (item) {
    crumbs.push({
      label: item.label,
      href: extraTrail ? item.href : undefined,
    });
  }
  if (extraTrail) {
    crumbs.push({ label: extraTrail });
  }

  return crumbs;
}
