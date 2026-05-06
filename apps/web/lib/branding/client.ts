// apps/web/lib/branding/client.ts
"use client";

import { createContext, createElement, useContext, type ReactNode } from "react";
import { fallbackTheme, type WebBrandingTheme } from "./types";

type BrandingContextValue = {
  client: string;
  theme: WebBrandingTheme;
  assetUrl: (file: string) => string;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

const PUBLIC_PREFIX = "/branding/current/";

export function BrandingProvider({
  client,
  theme,
  children,
}: {
  client: string;
  theme: WebBrandingTheme;
  children: ReactNode;
}) {
  const value: BrandingContextValue = {
    client,
    theme,
    assetUrl: (file: string) => `${PUBLIC_PREFIX}${file}`,
  };
  return createElement(BrandingContext.Provider, { value }, children);
}

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    return {
      client: "Default",
      theme: fallbackTheme,
      assetUrl: (file: string) => `${PUBLIC_PREFIX}${file}`,
    };
  }
  return ctx;
}

export function useTheme(): WebBrandingTheme {
  return useBranding().theme;
}
