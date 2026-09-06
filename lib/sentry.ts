import * as Sentry from '@sentry/nextjs';

/**
 * Sensitive field patterns that must NEVER be captured by Sentry
 */
const SENSITIVE_KEY_PATTERN = /(?:password|secret|token|auth|otp|pin|cvv|key|bearer|credential|cookie|private|phone|mobile|customer[_-]?phone|upi|vpa|bank[_-]?account|account[_-]?number|card[_-]?number)/i;

/**
 * Value regex patterns for secrets and personal identifiers
 */
const PATTERNS = {
  jwt: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g,
  apiKey: /AIza[0-9A-Za-z-_]{30,45}/g,
  indianPhone: /(?:\+91|91)?[6-9]\d{9}/g,
  creditCard: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
  bearerToken: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  otp: /(?:otp|passcode|pin|one[- ]time[- ]password|verification[- ]code)[:=\s]+([0-9]{4,8})\b/gi,
};

/**
 * Recursively sanitize any object, array, or primitive before sending to Sentry
 */
export function sanitizeData(data: any, depth = 0): any {
  if (depth > 6) return '[MAX_DEPTH_REACHED]';
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    let sanitized = data
      .replace(PATTERNS.jwt, '[REDACTED_JWT_TOKEN]')
      .replace(PATTERNS.apiKey, '[REDACTED_API_KEY]')
      .replace(PATTERNS.bearerToken, 'Bearer [REDACTED_TOKEN]')
      .replace(PATTERNS.creditCard, '[REDACTED_CARD_NUMBER]')
      .replace(PATTERNS.indianPhone, '[REDACTED_PHONE]')
      .replace(PATTERNS.otp, (match) => {
        const parts = match.split(/[:=\s]+/);
        const prefix = parts.slice(0, -1).join(' ');
        return `${prefix} [REDACTED_OTP]`;
      });
    return sanitized;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        cleaned[key] = '[REDACTED_SENSITIVE_DATA]';
      } else {
        cleaned[key] = sanitizeData(value, depth + 1);
      }
    }
    return cleaned;
  }

  return String(data);
}

export type WhatsBillModule =
  | 'auth'
  | 'supabase'
  | 'ai'
  | 'whatsapp'
  | 'billing'
  | 'gst'
  | 'payments'
  | 'receivables';

export interface SafeErrorContext {
  module: WhatsBillModule;
  action: string;
  errorType: string;
  safeOrgId?: string;
  safeUserId?: string;
  extra?: Record<string, string | number | boolean | null | undefined>;
}

export function captureWhatsBillError(
  error: unknown,
  context: SafeErrorContext
): string {
  const safeTags: Record<string, string> = {
    module: context.module,
    action: context.action,
    error_type: context.errorType,
  };

  const safeExtra: Record<string, any> = {
    safe_org_id: context.safeOrgId ? sanitizeData(context.safeOrgId) : undefined,
    safe_user_id: context.safeUserId ? sanitizeData(context.safeUserId) : undefined,
    ...(context.extra ? sanitizeData(context.extra) : {}),
  };

  return Sentry.captureException(error, {
    tags: safeTags,
    extra: safeExtra,
  });
}

export { Sentry };
