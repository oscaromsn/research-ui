import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JotaiProvider } from "@/components/providers/jotai-provider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JurisConsulta",
  description: "Pesquisa e relatórios jurídicos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} flex min-h-screen flex-col bg-[#f8f9fa] dark:bg-[#121620]`}
      >
        <JotaiProvider>{children}</JotaiProvider>
      </body>
    </html>
  );
}
