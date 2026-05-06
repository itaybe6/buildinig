// apps/web/lib/branding/server.ts
//
// Reads branding/<Client>/ from the filesystem on the Next.js server
// (Server Components, Route Handlers, middleware). Cached in-memory per process.

import "server-only";
import fs from "node:fs";
import path from "node:path";
import {
  fallbackTheme,
  fallbackWebConfig,
  type WebBrandingConfig,
  type WebBrandingTheme,
} from "./types";

const repoRoot = path.resolve(process.cwd(), "..", "..");
const brandingRoot = path.join(repoRoot, "branding");

let cachedClient: string | null = null;
let cachedTheme: WebBrandingTheme | null = null;
let cachedConfig: WebBrandingConfig | null = null;
let envLoaded = false;

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function getActiveClient(): string {
  if (cachedClient) return cachedClient;

  const fromEnv = process.env.CLIENT || process.env.NEXT_PUBLIC_CLIENT;
  if (fromEnv && fromEnv.trim()) {
    cachedClient = fromEnv.trim();
    return cachedClient;
  }

  const currentJson = readJson<{ client?: string }>(
    path.join(brandingRoot, "current.json"),
    {}
  );
  cachedClient = currentJson.client || "Default";
  return cachedClient;
}

export function getTheme(): WebBrandingTheme {
  if (cachedTheme) return cachedTheme;
  const client = getActiveClient();
  const file = path.join(brandingRoot, client, "theme.json");
  const partial = readJson<Partial<WebBrandingTheme>>(file, {});
  cachedTheme = {
    branding: { ...fallbackTheme.branding, ...(partial.branding || {}) },
    fonts: { ...fallbackTheme.fonts, ...(partial.fonts || {}) },
    radius: partial.radius ?? fallbackTheme.radius,
    colors: { ...fallbackTheme.colors, ...(partial.colors || {}) },
  };
  return cachedTheme;
}

export function getWebConfig(): WebBrandingConfig {
  if (cachedConfig) return cachedConfig;
  const client = getActiveClient();
  const file = path.join(brandingRoot, client, "web.config.json");
  const partial = readJson<Partial<WebBrandingConfig>>(file, {});
  cachedConfig = { ...fallbackWebConfig, ...partial };
  return cachedConfig;
}

/**
 * Loads the per-client .env values into process.env at server startup.
 * Next.js loads `.env.local` automatically; this is a complement that
 * reads `branding/<Client>/.env` so the same values come through whichever
 * client is active.
 *
 * Call once early (e.g. in a server-only module imported by layout.tsx).
 * Existing process.env keys win — env passed to `next dev` always wins.
 */
export function loadClientEnvOnce() {
  if (envLoaded) return;
  envLoaded = true;
  const client = getActiveClient();
  const file = path.join(brandingRoot, client, ".env");
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
