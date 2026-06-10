import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/service-worker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3737";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "StayRank — rank where to stay, together",
    template: "%s · StayRank",
  },
  description:
    "Plan a trip with friends and rank where to stay — everyone's top 3, with notes, into one leaderboard.",
  applicationName: "StayRank",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StayRank",
  },
  openGraph: {
    title: "StayRank — rank where to stay, together",
    description:
      "Everyone's top 3, with notes, into one leaderboard. Find the place you all agree on.",
    siteName: "StayRank",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e93f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
