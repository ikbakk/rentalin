import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";
import "lenis/dist/lenis.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f1efe5",
};

export const metadata: Metadata = {
  title: "Rentalin — Workspace",
  description: "Vehicle rental operations workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
