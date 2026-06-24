import type { Metadata } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { prisma } from "@/lib/prisma";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  let appName = "TruckLease Pro";
  let description = "Nigeria's trusted platform for truck hire, equipment leasing, and construction materials.";
  let faviconUrl: string | null = null;
  try {
    const settings = await prisma.platformSettings.findFirst();
    if (settings) {
      if (settings.appName) appName = settings.appName;
      if (settings.companyName && !settings.appName) appName = settings.companyName;
      if (settings.faviconUrl) faviconUrl = settings.faviconUrl;
    }
  } catch {
    // fallback defaults
  }
  return {
    title: { default: `${appName} — Truck & Equipment Leasing`, template: `%s | ${appName}` },
    description,
    icons: faviconUrl ? { icon: faviconUrl } : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-neutral-50 font-sans text-neutral-700 antialiased" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){var o=new MutationObserver(function(m){for(var i=0;i<m.length;i++){var mu=m[i];if(mu.type==="attributes"&&mu.attributeName==="bis_skin_checked"){mu.target.removeAttribute("bis_skin_checked")}}});o.observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:["bis_skin_checked"]});document.querySelectorAll("[bis_skin_checked]").forEach(function(e){e.removeAttribute("bis_skin_checked")})})()`
        }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
