// apps/mobile/src/theme/ThemeProvider.tsx
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getActiveClient, getActiveTheme } from "./getExpoExtra";
import { getIcon, getLogo, getSplash } from "./assets";
import type { Theme } from "./types";

type ThemeContextValue = {
  client: string;
  theme: Theme;
  logo: ReturnType<typeof getLogo>;
  logoWhite: ReturnType<typeof getLogo>;
  splash: ReturnType<typeof getSplash>;
  icon: ReturnType<typeof getIcon>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useMemo<ThemeContextValue>(() => {
    const client = getActiveClient();
    return {
      client,
      theme: getActiveTheme(),
      logo: getLogo(client, "default"),
      logoWhite: getLogo(client, "white"),
      splash: getSplash(client),
      icon: getIcon(client),
    };
  }, []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}
