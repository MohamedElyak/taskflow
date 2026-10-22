import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, CircleAlert, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3500);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({ success: (m) => push('success', m), error: (m) => push('error', m) }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className="toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-line bg-surface p-3 pr-2 shadow-lg"
          >
            {t.type === 'error' ? (
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-500" aria-hidden />
            ) : (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-hidden />
            )}
            <p className="flex-1 text-sm">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded p-1 text-muted hover:bg-sunken"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
