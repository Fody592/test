import { memo } from 'react';
import { useStore } from '../store/useStore.js';

/** One flavor: color dot, name, percent, slider and +/- counter buttons. */
function FlavorCard({ flavor, onEdit }) {
  const pct = useStore((s) => s.levels[flavor.id]);
  const setLevel = useStore((s) => s.setLevel);
  const active = pct > 0;

  return (
    <div
      className={`rounded-2xl border p-3 transition ${
        active ? 'border-indigo-500/60 bg-slate-900 shadow-lg shadow-indigo-500/10' : 'border-slate-800 bg-slate-900/60'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: flavor.color }} />
          <span className="truncate text-sm font-semibold">{flavor.name}</span>
        </div>
        <button onClick={() => onEdit(flavor.id)} className="flex items-center gap-1 text-xs tabular-nums text-slate-400 active:scale-90" aria-label={`Rename ${flavor.name}`}>
          #{flavor.id} <span className="text-sm">✏️</span>
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button onClick={() => setLevel(flavor.id, pct - 10)} className="h-8 w-8 rounded-lg bg-slate-800 text-lg active:scale-90">−</button>
        <div className="flex-1 text-center text-xl font-bold tabular-nums">{pct}%</div>
        <button onClick={() => setLevel(flavor.id, pct + 10)} className="h-8 w-8 rounded-lg bg-slate-800 text-lg active:scale-90">+</button>
      </div>

      <input
        type="range" min="0" max="100" step="5" value={pct}
        onChange={(e) => setLevel(flavor.id, Number(e.target.value))}
        className="mt-1 w-full"
        style={{ accentColor: flavor.color }}
        aria-label={`${flavor.name} amount`}
      />
    </div>
  );
}

export default memo(FlavorCard);
