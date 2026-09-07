import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
};

const hasSentry = Boolean(
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  process.env.SENTRY_DSN ||
  (process.env.SENTRY_ORG && process.env.SENTRY_PROJECT)
);

export default hasSentry
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    })
  : nextConfig;
