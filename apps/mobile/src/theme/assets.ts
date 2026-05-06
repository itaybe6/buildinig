// apps/mobile/src/theme/assets.ts
//
// IMPORTANT: Metro requires require() paths to be statically analyzable.
// When adding a new client, add a row to each map below pointing to the
// corresponding file inside branding/<Client>/.

import type { ImageSourcePropType } from "react-native";

export type ClientName = "Default" | string;

export const clientLogos: Record<string, ImageSourcePropType> = {
  Default: require("../../../../branding/Default/logo.png"),
};

export const clientLogosWhite: Record<string, ImageSourcePropType> = {
  Default: require("../../../../branding/Default/logo-white.png"),
};

export const clientSplashes: Record<string, ImageSourcePropType> = {
  Default: require("../../../../branding/Default/splash.png"),
};

export const clientIcons: Record<string, ImageSourcePropType> = {
  Default: require("../../../../branding/Default/icon.png"),
};

export function getLogo(client: string, variant: "default" | "white" = "default") {
  const map = variant === "white" ? clientLogosWhite : clientLogos;
  return map[client] ?? map["Default"];
}

export function getSplash(client: string) {
  return clientSplashes[client] ?? clientSplashes["Default"];
}

export function getIcon(client: string) {
  return clientIcons[client] ?? clientIcons["Default"];
}
