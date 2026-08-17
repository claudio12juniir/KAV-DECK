import { createContext, useCallback, useContext, useState } from "react";
import "./Toast.css";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, { tone = "neutral", duration = 4000 } = {}) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, tone }]);
      if (duration) setTimeout(() => remove(id), duration);
    },
    [remove],
  );

  const toast = {
    show,
    success: (message, opts) => show(message, { ...opts, tone: "success" }),
    error: (message, opts) => show(message, { ...opts, tone: "danger" }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-viewport" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast deve ser usado dentro de <ToastProvider>.");
  return context;
}
