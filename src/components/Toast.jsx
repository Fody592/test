import { useEffect } from 'react';
import { useStore } from '../store/useStore.js';

const COLORS = { error: 'bg-rose-600', success: 'bg-emerald-600', info: 'bg-slate-700' };

/** Auto-dismissing toast for errors / confirmations. */
export default function Toast() {
  const toast = useStore((s) => s.toast);
  const clear = useStore((s) => s.clearToast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 3500);
    return () => clearTimeout(t);
  }, [toast, clear]);
  if (!toast) return null;
  return (
    <div className={`fixed left-1/2 top-20 z-[60] max-w-[90%] -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl ${COLORS[toast.type]}`}>
      {toast.text}
    </div>
  );
}
