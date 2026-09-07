import * as Sentry from '@sentry/nextjs';
import { sanitizeData } from '@/lib/sentry';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || 'whatsbill@1.0.0',
    tracesSampleRate: 0.1,
    debug: false,
    beforeSend(event) {
      if (event.request?.headers) {
        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(event.request.headers)) {
          if (/(?:auth|cookie|token|key)/i.test(k)) {
            headers[k] = '[REDACTED]';
          } else {
            headers[k] = String(v);
          }
        }
        event.request.headers = headers;
      }
      if (event.extra) {
        event.extra = sanitizeData(event.extra);
      }
      return event;
    },
  });
}
