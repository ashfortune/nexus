/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 배포 시 이미지 최적화 관련 설정을 위해 추가
  images: {
    domains: ['ashfortune-nexus-ai-api.hf.space', 'nexus-backend.onrender.com'],
  },
};

export default nextConfig;
