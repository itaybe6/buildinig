// apps/web/lib/branding/index.ts
//
// Public surface of the web branding module.
// Server side: import from "./server" directly.
// Client side: import from "./client" (BrandingProvider, useBranding, useTheme).

export { getBusinessId, tryGetBusinessId } from "./getBusinessId";
export type {
  WebBrandingConfig,
  WebBrandingTheme,
} from "./types";
export { fallbackTheme, fallbackWebConfig } from "./types";
export { themeToCssVars } from "./themeToCssVars";
