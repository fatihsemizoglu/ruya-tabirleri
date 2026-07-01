import { toast, type ExternalToast } from 'sonner';

type NotifyOptions = {
  description?: string | undefined;
  action?: {
    label: string;
    onClick: () => void;
  } | undefined;
  duration?: number | undefined;
  id?: string | number | undefined;
};

type NotifyPromiseMessages<T> = {
  loading: string;
  success: string | ((data: T) => string);
  error?: string | ((error: unknown) => string) | undefined;
};

const DEFAULT_DURATION = 4500;
const ERROR_DURATION = 7000;

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return 'Beklenmeyen bir hata oluştu';
}

function buildOptions(options?: NotifyOptions): ExternalToast {
  if (!options) return {};
  const base: ExternalToast = { duration: options.duration ?? DEFAULT_DURATION };
  if (options.description !== undefined) base.description = options.description;
  if (options.id !== undefined) base.id = options.id;
  if (options.action !== undefined) base.action = options.action;
  return base;
}

function buildErrorOptions(options?: NotifyOptions): ExternalToast {
  if (!options) return { duration: ERROR_DURATION };
  const base: ExternalToast = { duration: options.duration ?? ERROR_DURATION };
  if (options.description !== undefined) base.description = options.description;
  if (options.id !== undefined) base.id = options.id;
  if (options.action !== undefined) base.action = options.action;
  return base;
}

function buildLoadingOptions(options?: NotifyOptions): ExternalToast {
  const base: ExternalToast = {};
  if (options?.description !== undefined) base.description = options.description;
  if (options?.id !== undefined) base.id = options.id;
  if (options?.duration !== undefined) base.duration = options.duration;
  return base;
}

export const notify = {
  success(message: string, options?: NotifyOptions) {
    return toast.success(message, buildOptions(options));
  },

  error(message: string, options?: NotifyOptions) {
    return toast.error(message, buildErrorOptions(options));
  },

  info(message: string, options?: NotifyOptions) {
    return toast.info(message, buildOptions(options));
  },

  warning(message: string, options?: NotifyOptions) {
    return toast.warning(message, buildErrorOptions(options));
  },

  loading(message: string, options?: NotifyOptions) {
    return toast.loading(message, buildLoadingOptions(options));
  },

  promise<T>(promise: Promise<T>, messages: NotifyPromiseMessages<T>) {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: (error) => (messages.error ? (typeof messages.error === 'function' ? messages.error(error) : messages.error) : getErrorMessage(error)),
    });
  },

  dismiss(id?: string | number) {
    toast.dismiss(id);
  },
};

export { getErrorMessage };
