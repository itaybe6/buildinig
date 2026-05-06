import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import {
  getActiveClient,
  getTheme,
  getWebConfig,
  loadClientEnvOnce,
} from "@/lib/branding/server";
import { themeToCssVars } from "@/lib/branding/themeToCssVars";
import "./globals.css";

loadClientEnvOnce();

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const cfg = getWebConfig();
  return {
    title: cfg.title,
    description: cfg.description,
    icons: {
      icon: "/branding/current/favicon.png",
    },
  };
}

export function generateViewport(): Viewport {
  const cfg = getWebConfig();
  return {
    themeColor: cfg.manifestThemeColor,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const cfg = getWebConfig();
  const theme = getTheme();
  const client = getActiveClient();
  const cssVars = themeToCssVars(theme);

  return (
    <html
      lang={cfg.lang}
      dir={cfg.dir}
      className={rubik.variable}
      style={{ ["--brand-style" as string]: cssVars }}
    >
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root { ${cssVars} }`,
          }}
        />
      </head>
      <body
        className={`${rubik.className} min-h-screen font-sans antialiased`}
      >
        <Providers client={client} theme={theme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
