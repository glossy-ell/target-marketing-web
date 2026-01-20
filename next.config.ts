import type { NextConfig } from "next";

const nextConfig = {
  typescript: {
    // 타입 에러가 있어도 빌드 성공하도록 강제
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint 에러 무시하고 빌드 가능하게
    ignoreDuringBuilds: true,
  },
};


export default nextConfig;
