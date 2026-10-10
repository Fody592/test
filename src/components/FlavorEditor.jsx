import { useState } from 'react';
import { FLAVORS } from '../constants/flavors.js';
import { useFlavors } from '../utils/flavors.js';
import { useStore } from '../store/useStore.js';

/** Modal to rename what is loaded on a pump (name, color, taste notes for the AI). */
export default function FlavorEditor({ id, onClose }) {
  const flavor = useFlavors().find((f) => f.id === id);
  const original = FLAVORS.find((f) => f.id === id);
  const { setFlavor, resetFlavor, notify } = useStore();
  const [name, setName] = useState(flavor.name);
  const [color, setColor] = useState(flavor.color);
  const [notes, setNotes] = useState(flavor.tags.join(', '));

  const save = () => {
    if (!name.trim()) return notify('error', 'Flavor name cannot be empty.');
    const tags = notes.split(',').map((t) => t.trim()).filter(Boolean);
    setFlavor(id, { name: name.trim().slice(0, 24), color, tags });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md space-y-3 rounded-t-2xl border border-slate-700 bg-slate-900 p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold">Pump #{id} flavor</h2>

        <label className="block text-xs text-slate-400">Name</label>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={24}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500" />

        <label className="block text-xs text-slate-400">Color</label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-full rounded-lg bg-slate-950" />

        <label className="block text-xs text-slate-400">Taste notes for the AI (comma separated)</label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="sweet, tropical, creamy"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500" />

        <div className="flex gap-2 pt-2">
          <button onClick={() => { resetFlavor(id); onClose(); }} className="rounded-lg bg-slate-800 px-3 py-2 text-sm active:scale-95">
            Reset to {original.name}
          </button>
          <button onClick={onClose} className="ml-auto rounded-lg bg-slate-800 px-3 py-2 text-sm active:scale-95">Cancel</button>
          <button onClick={save} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold active:scale-95">Save</button>
        </div>
      </div>
    </div>
  );
}
