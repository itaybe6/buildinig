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
};

export default nextConfig;
