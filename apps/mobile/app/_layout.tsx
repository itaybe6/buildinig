import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { I18nManager } from "react-native";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import "../global.css";

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000 },
        },
      })
  );

  useEffect(() => {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
