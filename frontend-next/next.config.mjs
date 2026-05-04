/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 배포 시 이미지 최적화 관련 설정을 위해 추가
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ashfortune-nexus-ai-api.hf.space',
      },
      {
        protocol: 'https',
        hostname: 'nexus-backend.onrender.com',
      },
      {
        protocol: 'https',
        hostname: 'vrxuoqzgeyhoeaqtfuzm.supabase.co',
      }
    ],
  },
};

export default nextConfig;
