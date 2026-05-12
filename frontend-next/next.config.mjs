/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const springUrl = 'http://nexus-spring:8080';
    const fastapiUrl = 'http://nexus-fastapi:7860';

    return [
      {
        source: '/api/v1/ai/:path*',
        destination: `${fastapiUrl}/api/v1/ai/:path*`,
      },
      {
        source: '/api/v1/:path*',
        destination: `${springUrl}/api/v1/:path*`,
      },
      {
        source: '/ws-nexus/:path*',
        destination: `${springUrl}/ws-nexus/:path*`,
      },
    ];
  },
  // 배포 시 이미지 최적화 관련 설정을 위해 추가
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'nexus-changup.com',
      },
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
      },
    ],
  },
};

export default nextConfig;
