// apps/mobile/src/theme/getExpoExtra.ts
import Constants from "expo-constants";
import { CURRENT_CLIENT } from "../config/currentClient";
import { fallbackTheme, type Theme } from "./types";

type ExpoExtra = {
  CLIENT?: string;
  BUSINESS_ID?: string;
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  theme?: Partial<Theme>;
};

export function getExpoExtra(): ExpoExtra {
  return (Constants?.expoConfig?.extra ?? {}) as ExpoExtra;
}

export function getActiveClient(): string {
  return getExpoExtra().CLIENT || CURRENT_CLIENT;
}

export function getActiveTheme(): Theme {
  const fromExtra = getExpoExtra().theme;
  if (!fromExtra) return fallbackTheme;
  return {
    branding: { ...fallbackTheme.branding, ...(fromExtra.branding || {}) },
    fonts: { ...fallbackTheme.fonts, ...(fromExtra.fonts || {}) },
    radius: fromExtra.radius ?? fallbackTheme.radius,
    colors: { ...fallbackTheme.colors, ...(fromExtra.colors || {}) },
  };
}
