/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@my-project/supabase",
    "@my-project/shared",
    "@my-project/ui-web",
  ],
  env: {
    NEXT_PUBLIC_CLIENT: process.env.CLIENT || process.env.NEXT_PUBLIC_CLIENT || "Default",
  },
  experimental: {
    /**
     * Tree-shake imports במקום לעבד את כל ה-barrel — מאיץ קומפילציה ב-dev
     * ומקטין את ה-bundle. רלוונטי לחבילות עם export * מ-index.
     */
    optimizePackageImports: [
      "@my-project/ui-web",
      "@radix-ui/react-slot",
      "@tanstack/react-query",
    ],
  },
  /**
   * שומר עמודים שכבר קומפלו "חמים" יותר זמן — פחות recompiles בזמן ניווטים
   * חוזרים בין דפים ב-dev.
   */
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 8,
  },
};

export default nextConfig;
