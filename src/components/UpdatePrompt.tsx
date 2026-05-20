import { useRegisterSW } from "virtual:pwa-register/react";

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) {
      // eslint-disable-next-line no-console
      console.warn("SW registration failed", err);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-4 pt-safe pointer-events-none">
      <div className="mx-auto max-w-md mt-4 bg-brand-600 text-white rounded-2xl shadow-lift px-5 py-3 flex items-center gap-3 pointer-events-auto animate-fade-up">
        <span className="text-2xl" aria-hidden>✨</span>
        <div className="flex-1">
          <div className="font-bold text-sm">Ny version klar</div>
          <div className="text-brand-100 text-xs">Genindlæs for at få nye funktioner</div>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-white text-brand-700 font-bold text-sm px-4 py-2 rounded-xl active:scale-95 transition-transform"
        >
          Opdater
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          aria-label="Senere"
          className="text-brand-200 active:text-white"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}
