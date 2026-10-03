import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviator",
  description: "Provably fair crash game",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0b0f1a] text-white">{children}</body>
    </html>
  );
}
