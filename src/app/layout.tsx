import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Looksmaxing AI - Transform Your Appearance",
  description: "AI-powered appearance analysis and personalized tips for looking your best. Analyze photos, get advice, and track your progress.",
  keywords: ["looksmaxing", "appearance", "AI", "fashion", "skincare", "hairstyle", "self-improvement"],
  authors: [{ name: "Looksmaxing AI" }],
  openGraph: {
    title: "Looksmaxing AI - Transform Your Appearance",
    description: "AI-powered appearance analysis and personalized tips for looking your best.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
