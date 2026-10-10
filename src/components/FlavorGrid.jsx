import { useState } from 'react';
import { useFlavors } from '../utils/flavors.js';
import { useStore } from '../store/useStore.js';
import FlavorCard from './FlavorCard.jsx';
import FlavorEditor from './FlavorEditor.jsx';

/** Mix tab: 19-flavor grid + sticky action bar (dispense / reset / save recipe). */
export default function FlavorGrid() {
  const { levels, resetLevels, dispenseCurrent, saveRecipe } = useStore();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null); // pump id being renamed
  const FLAVORS = useFlavors();
  const active = FLAVORS.filter((f) => levels[f.id] > 0);

  return (
    <section className="space-y-4 pb-44">
      <div className="grid grid-cols-2 gap-3">
        {FLAVORS.map((f) => <FlavorCard key={f.id} flavor={f} onEdit={setEditing} />)}
      </div>

      {editing && <FlavorEditor id={editing} onClose={() => setEditing(null)} />}

      {/* Sticky action bar sits above the bottom nav */}
      <div className="fixed inset-x-0 bottom-[68px] z-10 border-t border-slate-800 bg-slate-950/95 p-3 backdrop-blur">
        <p className="mb-2 truncate text-xs text-slate-400">
          {active.length ? active.map((f) => `${f.name} ${levels[f.id]}%`).join(' · ') : 'Pick some flavors to start mixing'}
        </p>
        <div className="flex gap-2">
          <input
            value={name} onChange={(e) => setName(e.target.value)} placeholder="Recipe name"
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => { saveRecipe(name); if (name.trim() && active.length) setName(''); }}
            className="rounded-lg bg-slate-800 px-3 text-sm font-semibold active:scale-95"
          >Save</button>
          <button onClick={resetLevels} className="rounded-lg bg-slate-800 px-3 text-sm active:scale-95">Reset</button>
          <button onClick={dispenseCurrent} className="rounded-lg bg-indigo-600 px-4 text-sm font-bold active:scale-95">Pour</button>
        </div>
      </div>
    </section>
  );
}
