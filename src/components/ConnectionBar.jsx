import { useStore } from '../store/useStore.js';

const STYLES = {
  connected: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  connecting: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  disconnected: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
};

/** Top bar: shows BLE status and connect/disconnect button. */
export default function ConnectionBar() {
  const { conn, connect, disconnect } = useStore();
  const busy = conn.status === 'connecting';
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/90 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
      <h1 className="text-lg font-bold tracking-tight">🥤 Flavor Dispenser</h1>
      <div className="flex items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STYLES[conn.status]}`}>
          {conn.status === 'connected' ? conn.name : conn.status}
        </span>
        <button
          disabled={busy}
          onClick={conn.status === 'connected' ? disconnect : connect}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold active:scale-95 disabled:opacity-50"
        >
          {conn.status === 'connected' ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </header>
  );
}
