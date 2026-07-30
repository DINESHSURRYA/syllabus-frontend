/** @type {import('next').NextConfig} */
const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_EVALUATOR_API_URL || 'http://localhost:8000';

const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      /**
       * Forward /api requests to FastAPI backend when not handled by Next.js app routes.
       */
      {
        source: '/api/evaluator/:path*',
        destination: `${BACKEND_API_URL}/api/evaluator/:path*`,
      },
      {
        source: '/api/courses/:path*',
        destination: `${BACKEND_API_URL}/api/courses/:path*`,
      },
      {
        source: '/api/jobs/:path*',
        destination: `${BACKEND_API_URL}/api/jobs/:path*`,
      },
      {
        source: '/api/timeline/:path*',
        destination: `${BACKEND_API_URL}/api/timeline/:path*`,
      },
      {
        source: '/api/pedagogy/:path*',
        destination: `${BACKEND_API_URL}/api/pedagogy/:path*`,
      },
      {
        source: '/api/ekg/:path*',
        destination: `${BACKEND_API_URL}/api/ekg/:path*`,
      },
      {
        source: '/api/analytics/:path*',
        destination: `${BACKEND_API_URL}/api/analytics/:path*`,
      },
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_API_URL}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;


