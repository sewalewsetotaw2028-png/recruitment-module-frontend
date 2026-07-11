import React, { createContext, useCallback, useContext, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number | null;
  isLoading?: boolean;
}

interface ToastOptions {
  duration?: number | null;
  isLoading?: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (
      message: string,
      type: ToastType = 'success',
      options: ToastOptions = {},
    ) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const toastItem: ToastItem = {
        id,
        message,
        type,
        duration: options.duration ?? 4000,
        isLoading: options.isLoading,
      };

      setItems((prev) => [...prev, toastItem]);
      if (toastItem.duration && toastItem.duration > 0) {
        setTimeout(
          () => setItems((prev) => prev.filter((t) => t.id !== id)),
          toastItem.duration,
        );
      }

      return id;
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll }}>
      {children}
      <div className="fixed top-20 right-4 z-999999 space-y-2 max-w-sm">
        {items.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg border text-sm font-semibold animate-fade-in ${
              t.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : t.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {t.isLoading && (
                <span className="material-symbols-outlined animate-spin text-sm leading-none">
                  autorenew
                </span>
              )}
              <span>{t.message}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
