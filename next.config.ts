import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 네이티브 모듈을 서버 번들에서 외부 패키지로 처리
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
