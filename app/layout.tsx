import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

const fontDisplay = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const fontSans = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" });
const fontMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";

export const metadata: Metadata = {
  title: "Gyra — Intelligence, Simplified.",
  description:
    "Gyra is a multimodal AI platform for people, developers, and the applications they build. Chat, vision, files, voice, and developer APIs — unified under one intelligence.",
  applicationName: "Gyra",
  authors: [{ name: "Victory Lord", url: "https://gyra.ng/about" }],
  creator: "Victory Lord",
  publisher: "Genvia AI Company",
  metadataBase: new URL("https://gyra.ng"),
  alternates: {
    canonical: "https://gyra.ng",
  },
  verification: {
    google: "t971Bzq7fEmv4L84b3V0xkE28aL-Px0pK10hXz59cmQ",
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
    shortcut: "/icon.png",
  },
  openGraph: {
    title: "Gyra",
    description:
      "An advanced and Simplified AI assistant created by gAi",
    url: "https://gyra.ng",
    siteName: "Gyra",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Gyra Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gyra",
    description:
      "An advanced and Simplified AI assistant created by gAi",
    images: ["/icon.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// ============================================================
// JSON-LD — structured data for Google's Knowledge Graph
// ============================================================
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://gyra.ng/#organization",
      name: "Genvia AI Company",
      alternateName: ["Genvia AI", "Genvia"],
      url: "https://gyra.ng",
      logo: {
        "@type": "ImageObject",
        url: "https://gyra.ng/icon.png",
        width: 512,
        height: 512,
      },
      founder: {
        "@id": "https://gyra.ng/#founder",
      },
      foundingDate: "2026",
      description:
        "Genvia AI Company builds Gyra, an intelligent, simplified AI assistant.",
      sameAs: ["https://t.me/Gyra_AiBot", "https://t.me/GenviaNews"],
    },
    {
      "@type": "Person",
      "@id": "https://gyra.ng/#founder",
      name: "Victory Lord",
      jobTitle: "Founder & CEO",
      worksFor: {
        "@id": "https://gyra.ng/#organization",
      },
      url: "https://gyra.ng/about",
    },
    {
      "@type": "WebSite",
      "@id": "https://gyra.ng/#website",
      url: "https://gyra.ng",
      name: "Gyra",
      publisher: {
        "@id": "https://gyra.ng/#organization",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://gyra.ng/#app",
      name: "Gyra",
      applicationCategory: "AIApplication",
      operatingSystem: "Web, iOS, Android",
      url: "https://gyra.ng",
      description:
        "Gyra is an intelligent, simplified AI assistant built by Genvia AI Company. Chat, vision, files, and voice — unified under one intelligence.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      publisher: {
        "@id": "https://gyra.ng/#organization",
      },
      author: {
        "@id": "https://gyra.ng/#founder",
      },
    },
  ],
};

// Runs before React hydrates — prevents flash of wrong theme
const THEME_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('gyra:theme');
    var isDark;
    if (stored === 'light') isDark = false;
    else if (stored === 'dark') isDark = true;
    else isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} scroll-smooth`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body className="antialiased surface">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}