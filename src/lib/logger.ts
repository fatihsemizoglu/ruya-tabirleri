import * as Sentry from '@sentry/react';

const isDev = import.meta.env.DEV;

export interface CaptureContext {
  tags?: Record<string, string | number | boolean>;
  extra?: Record<string, unknown>;
  level?: 'error' | 'warning' | 'info';
}

type ErrorLikeRecord = Record<string, unknown>;

const ERROR_MESSAGE_KEYS = ['message', 'error_description', 'details', 'hint', 'code'] as const;

function isRecord(value: unknown): value is ErrorLikeRecord {
  return typeof value === 'object' && value !== null;
}

function safeSerialize(value: unknown): unknown {
  if (!isRecord(value)) return value;

  try {
    return JSON.parse(JSON.stringify(value)) as unknown;
  } catch {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        typeof entry === 'function' ? '[Function]' : String(entry),
      ])
    );
  }
}

function getReadableErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;

  if (isRecord(error)) {
    for (const key of ERROR_MESSAGE_KEYS) {
      const value = error[key];
      if (typeof value === 'string' && value.trim()) return value;
      if (typeof value === 'number') return `${key}: ${value}`;
    }

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== '{}') return serialized;
    } catch {
      // Fall through to generic message below.
    }
  }

  return 'Unknown error';
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;

  const err = new Error(getReadableErrorMessage(error));
  err.name = isRecord(error) && typeof error.name === 'string' ? error.name : 'NonErrorThrown';
  return err;
}

function hasSentry(): boolean {
  try {
    return !!Sentry.getClient?.();
  } catch {
    return false;
  }
}

export function captureError(error: unknown, context: CaptureContext = {}): void {
  const err = normalizeError(error);
  const normalizedExtra = {
    ...(context.extra ?? {}),
    originalError: error instanceof Error ? undefined : safeSerialize(error),
  };

  if (hasSentry()) {
    Sentry.captureException(err, {
      level: context.level ?? 'error',
      ...(context.tags ? { tags: context.tags } : {}),
      extra: normalizedExtra,
    });
  }

  const tag = context.tags?.feature ? `[${context.tags.feature}]` : '[error]';
  console.error(tag, err, normalizedExtra);
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
