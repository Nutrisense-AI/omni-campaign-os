import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "OmniCampaign \u2014 Your AI Marketing Team in a Box",
  description:
    "Turn one sentence into a complete marketing campaign: ad copy, a stunning image, a voiced video, and a live landing page. Plus CRM, inbox, and email \u2014 all in one command center.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
