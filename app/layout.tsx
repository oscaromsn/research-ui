import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { JotaiProvider } from "@/components/providers/jotai-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LexiSynth",
  description: "Research and legal synthesis platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} flex flex-col min-h-screen bg-[#f8f9fa] dark:bg-[#121620]`}
      >
        <JotaiProvider>{children}</JotaiProvider>
      </body>
    </html>
  );
}
