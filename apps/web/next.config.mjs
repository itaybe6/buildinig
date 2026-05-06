import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..", "..");

/**
 * במונורפו pnpm יש כפילות של React: ה-root טעון React 19 (דרך mobile/react-native)
 * בעוד Next 14 דורש React 18. כתוצאה מכך נוצרים עותקים מרובים של React 18.3.1
 * (apps/web/node_modules/react, node_modules/next/node_modules/react), ש"שוברים"
 * את ה-Dispatcher של React (useReducer null) — זה גורם לרינדור לקרוס בכל בקשה,
 * ל-CSS/data לא להופיע, ולכל ניווט להיות איטי בטירוף.
 *
 * הפתרון: למפות בכוח את כל ייבוא של react / react-dom אל מסלולים יחידים שקיימים
 * פיזית — react אצל ה-web, react-dom ב-root (שניהם 18.3.1). ה-alias עם `$` הוא
 * מתאם מדויק; ה-alias בלי `$` מתאם גם תת-נתיבים (jsx-runtime, client, server וכו').
 */
const REACT_PATH = path.join(__dirname, "node_modules", "react");
const REACT_DOM_PATH = path.join(workspaceRoot, "node_modules", "react-dom");

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
    optimizePackageImports: [
      "@my-project/ui-web",
      "@radix-ui/react-slot",
      "@tanstack/react-query",
    ],
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 8,
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      react$: REACT_PATH,
      "react-dom$": REACT_DOM_PATH,
      "react/jsx-runtime$": path.join(REACT_PATH, "jsx-runtime.js"),
      "react/jsx-dev-runtime$": path.join(REACT_PATH, "jsx-dev-runtime.js"),
      "react-dom/client$": path.join(REACT_DOM_PATH, "client.js"),
      "react-dom/server$": path.join(REACT_DOM_PATH, "server.js"),
      "react-dom/server.browser$": path.join(REACT_DOM_PATH, "server.browser.js"),
      "react-dom/server.edge$": path.join(REACT_DOM_PATH, "server.edge.js"),
    };
    return config;
  },
};

export default nextConfig;
