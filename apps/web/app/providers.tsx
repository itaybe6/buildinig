"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { BrandingProvider } from "@/lib/branding/client";
import type { WebBrandingTheme } from "@/lib/branding/types";

export function Providers({
  client,
  theme,
  children,
}: {
  client: string;
  theme: WebBrandingTheme;
  children: ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <BrandingProvider client={client} theme={theme}>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        ) : null}
      </QueryClientProvider>
    </BrandingProvider>
  );
}
