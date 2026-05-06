// apps/web/lib/branding/themeToCssVars.ts
import type { WebBrandingTheme } from "./types";

/**
 * Convert hex string ("#2563eb" / "#fff") to space-separated HSL components ("221 83% 53%")
 * — the format required by Tailwind's `hsl(var(--primary))` pattern in apps/web/app/globals.css.
 */
function hexToHslComponents(hex: string): string {
  const match = /^#?([a-f\d]{3,8})$/i.exec(hex.trim());
  if (!match) return "0 0% 0%";

  let cleaned = match[1];
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (cleaned.length === 8) cleaned = cleaned.slice(0, 6);

  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  const H = Math.round(h * 360);
  const S = Math.round(s * 1000) / 10;
  const L = Math.round(l * 1000) / 10;

  return `${H} ${S}% ${L}%`;
}

const COLOR_VAR: Record<keyof WebBrandingTheme["colors"], string> = {
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
};

/**
 * Returns CSS string with --variables to be inlined into <html style="...">.
 * Example output: "--primary:221 83% 53%; --background:0 0% 100%; --radius:0.5rem;"
 */
export function themeToCssVars(theme: WebBrandingTheme): string {
  const lines: string[] = [];
  for (const [key, cssVar] of Object.entries(COLOR_VAR) as [
    keyof WebBrandingTheme["colors"],
    string
  ][]) {
    const hex = theme.colors[key];
    lines.push(`${cssVar}:${hexToHslComponents(hex)}`);
  }
  if (theme.radius) lines.push(`--radius:${theme.radius}`);
  return lines.join(";") + ";";
}
