import type { Metadata } from "next";

import { QueryProvider } from "@/lib/providers/query-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema Integral de Soporte Técnico FCQI",
  description: "Frontend del Sistema Integral de Soporte Técnico FCQI — UABC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
