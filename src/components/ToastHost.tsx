import { useApp } from "../state/AppContext";

export function ToastHost() {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-4 pb-safe pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-ink-900 text-white rounded-2xl shadow-lift px-5 py-3 flex items-center gap-4 max-w-sm w-full animate-fade-up"
        >
          <span className="flex-1 font-semibold text-sm">{t.text}</span>
          {t.undo && (
            <button
              onClick={() => { t.undo?.(); dismissToast(t.id); }}
              className="text-brand-300 font-bold text-sm uppercase tracking-wide active:scale-95 transition-transform"
            >
              Fortryd
            </button>
          )}
          <button
            onClick={() => dismissToast(t.id)}
            aria-label="Luk"
            className="text-ink-400 active:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ))}
    </div>
  );
}
