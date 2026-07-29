/** @type {import('next').NextConfig} */
const EVALUATOR_API_URL =
  process.env.NEXT_PUBLIC_EVALUATOR_API_URL || 'http://localhost:8000';

const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      /**
       * Forward every /api/evaluator/<path> request to the real backend.
       * Covers: /upload, /start_interview, /submit_answer, /stop_interview,
       *         /admin/interviews, /admin/interviews/:id, /admin/logs
       * The browser only talks to localhost — CORS is avoided entirely.
       */
      {
        source: '/api/evaluator/:path*',
        destination: `${EVALUATOR_API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
