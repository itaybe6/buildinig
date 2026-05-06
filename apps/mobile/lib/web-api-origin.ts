import Constants from "expo-constants";

/** בסיס URL של שרת Next (לאפליקציות שקוראות ל־API של הווב). */
export function webApiOrigin(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_WEB_APP_ORIGIN?.trim();
  const fromExtra =
    (
      Constants.expoConfig?.extra as
        | { EXPO_PUBLIC_WEB_APP_ORIGIN?: string }
        | undefined
    )?.EXPO_PUBLIC_WEB_APP_ORIGIN?.trim() ?? null;
  const origin = fromEnv || fromExtra;
  return origin ? origin.replace(/\/$/, "") : null;
}
