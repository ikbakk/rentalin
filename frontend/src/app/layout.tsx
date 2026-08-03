import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a1c2e",
};

export const metadata: Metadata = {
  title: "Rentalin",
  description: "Vehicle rental operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-dvh bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
