export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  TIMEOUT: Number(process.env.NEXT_PUBLIC_TIMEOUT || 300000),
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Syllabus Intelligence Platform',
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
};
