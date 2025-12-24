import { useEffect } from "react";

const styles = {
  success: "bg-emerald-600 text-white",
  error: "bg-rose-600 text-white",
  info: "bg-slate-700 text-white",
};

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => onDismiss(), 3200);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`rounded-xl px-4 py-3 text-sm shadow-soft ${styles[toast.type]}`}>
        {toast.message}
      </div>
    </div>
  );
}
