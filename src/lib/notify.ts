import { toast } from 'sonner';

type NotifyOptions = {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  id?: string | number;
};

type NotifyPromiseMessages<T> = {
  loading: string;
  success: string | ((data: T) => string);
  error?: string | ((error: unknown) => string);
};

const DEFAULT_DURATION = 4500;
const ERROR_DURATION = 7000;

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return 'Beklenmeyen bir hata oluştu';
}

export const notify = {
  success(message: string, options?: NotifyOptions) {
    return toast.success(message, {
      duration: options?.duration ?? DEFAULT_DURATION,
      description: options?.description,
      action: options?.action,
      id: options?.id,
    });
  },

  error(message: string, options?: NotifyOptions) {
    return toast.error(message, {
      duration: options?.duration ?? ERROR_DURATION,
      description: options?.description,
      action: options?.action,
      id: options?.id,
    });
  },

  info(message: string, options?: NotifyOptions) {
    return toast.info(message, {
      duration: options?.duration ?? DEFAULT_DURATION,
      description: options?.description,
      action: options?.action,
      id: options?.id,
    });
  },

  warning(message: string, options?: NotifyOptions) {
    return toast.warning(message, {
      duration: options?.duration ?? ERROR_DURATION,
      description: options?.description,
      action: options?.action,
      id: options?.id,
    });
  },

  loading(message: string, options?: NotifyOptions) {
    return toast.loading(message, {
      duration: options?.duration,
      description: options?.description,
      id: options?.id,
    });
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
