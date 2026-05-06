// apps/mobile/src/theme/types.ts

export type ThemeColors = {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveForeground: string;
};

export type ThemeBranding = {
  companyName: string;
  website?: string;
  supportEmail?: string;
};

export type ThemeFonts = {
  sans?: string;
};

export type Theme = {
  colors: ThemeColors;
  branding: ThemeBranding;
  fonts: ThemeFonts;
  radius?: string;
};

export const fallbackTheme: Theme = {
  branding: {
    companyName: "App",
  },
  fonts: { sans: "System" },
  radius: "0.5rem",
  colors: {
    primary: "#2563eb",
    primaryForeground: "#ffffff",
    secondary: "#f1f5f9",
    secondaryForeground: "#0f172a",
    background: "#ffffff",
    foreground: "#0f172a",
    card: "#ffffff",
    cardForeground: "#0f172a",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    accent: "#f1f5f9",
    accentForeground: "#0f172a",
    border: "#e2e8f0",
    input: "#e2e8f0",
    ring: "#2563eb",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
  },
};
