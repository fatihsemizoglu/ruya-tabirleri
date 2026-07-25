import * as Sentry from '@sentry/react';

const isDev = import.meta.env.DEV;

export interface CaptureContext {
  tags?: Record<string, string | number | boolean>;
  extra?: Record<string, unknown>;
  level?: 'error' | 'warning' | 'info';
}

function hasSentry(): boolean {
  try {
    return !!Sentry.getClient?.();
  } catch {
    return false;
  }
}

export function captureError(error: unknown, context: CaptureContext = {}): void {
  const err = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));

  if (hasSentry()) {
    Sentry.captureException(err, {
      level: context.level ?? 'error',
      ...(context.tags ? { tags: context.tags } : {}),
      ...(context.extra ? { extra: context.extra } : {}),
    });
  }

  const tag = context.tags?.feature ? `[${context.tags.feature}]` : '[error]';
  console.error(tag, err, context.extra ?? '');
}

export function captureMessage(message: string, context: CaptureContext = {}): void {
  if (hasSentry()) {
    Sentry.captureMessage(message, {
      level: context.level ?? 'info',
      ...(context.tags ? { tags: context.tags } : {}),
      ...(context.extra ? { extra: context.extra } : {}),
    });
  }

  const tag = context.tags?.feature ? `[${context.tags.feature}]` : '[info]';
  (context.level === 'error' ? console.error : console.info)(tag, message);
}

export const logger = {
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.info.bind(console),
  log: console.log.bind(console),
};

export default logger;
