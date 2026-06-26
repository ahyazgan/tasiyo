import { useState, useCallback, createContext, useContext } from "react";
import { Check, AlertCircle, Info } from "lucide-react";

const ToastContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}

// SAHA toast styles: 2px ink frame, sharp offset shadow, stroke icon.
const STYLES = {
  success: { bg: "#16803C", fg: "#FFFFFF", Icon: Check },
  error:   { bg: "#DC2626", fg: "#FFFFFF", Icon: AlertCircle },
  info:    { bg: "#0A0A0A", fg: "#FFFFFF", Icon: Info, iconColor: "#FACC15" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => {
          const s = STYLES[t.type] || STYLES.success;
          const { Icon } = s;
          return (
            <div
              key={t.id}
              className="toast"
              style={{
                background: s.bg,
                color: s.fg,
                border: "2px solid #0A0A0A",
                borderRadius: 6,
                boxShadow: "3px 3px 0 rgba(10,10,10,.35)",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontWeight: 700,
              }}
            >
              <span className="toast-icon" style={{ display: "flex" }}>
                <Icon size={18} strokeWidth={2.5} color={s.iconColor || s.fg} />
              </span>
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
