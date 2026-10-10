import { useState } from 'react';
import { useStore } from '../store/useStore.js';
import { listGeminiModels } from '../services/gemini.js';

/** Maintenance tab: line flush (R385 water pump) + app settings. */
export default function Maintenance() {
  const { flush, settings, updateSettings, notify } = useStore();
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const list = await listGeminiModels(settings.geminiKey);
      setModels(list);
      notify('success', `${list.length} text models found`);
    } catch (e) {
      notify('error', e.message);
    } finally {
      setLoadingModels(false);
    }
  };
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="font-bold">🧼 Flush lines</h2>
        <p className="mt-1 text-sm text-slate-400">Runs the water pump only. Place a cup or drain under the nozzle first.</p>
        <label className="mt-3 block text-xs text-slate-400">Flush duration: {(settings.flushMs / 1000).toFixed(1)} s</label>
        <input type="range" min="1000" max="15000" step="500" value={settings.flushMs}
          onChange={(e) => updateSettings({ flushMs: Number(e.target.value) })} className="w-full accent-sky-400" />
        <button onClick={flush} className="mt-3 w-full rounded-lg bg-sky-600 py-3 font-bold active:scale-95">Start flush</button>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="font-bold">⚙️ Settings</h2>

        <div>
          <label className="text-xs text-slate-400">Connection</label>
          <select value={settings.transport} onChange={(e) => updateSettings({ transport: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="ble">Bluetooth</option>
            <option value="wifi">Wi-Fi</option>
          </select>
          {settings.transport === 'wifi' && (
            <input value={settings.wsHost} onChange={(e) => updateSettings({ wsHost: e.target.value })}
              placeholder="ESP32 address (blank = this page's host)"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
          )}
          <p className="mt-1 text-xs text-slate-500">Reconnect after changing.</p>
        </div>

        <div>
          <label className="text-xs text-slate-400">Gemini API key</label>
          <input type="password" value={settings.geminiKey} onChange={(e) => updateSettings({ geminiKey: e.target.value.trim() })}
            placeholder="AIza…" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
          <p className="mt-1 text-xs text-slate-500">Stored only on this device.</p>
        </div>

        <div>
          <label className="text-xs text-slate-400">Gemini model</label>
          <div className="mt-1 flex gap-2">
            <input list="gemini-models" value={settings.geminiModel}
              onChange={(e) => updateSettings({ geminiModel: e.target.value.trim() })}
              placeholder="gemini-2.5-flash"
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
            <datalist id="gemini-models">{models.map((m) => <option key={m} value={m} />)}</datalist>
            <button onClick={loadModels} disabled={loadingModels}
              className="rounded-lg bg-slate-800 px-3 text-sm active:scale-95 disabled:opacity-50">
              {loadingModels ? '…' : 'Load list'}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">Type any Gemini model id, or tap Load list and pick one.</p>
        </div>

        <div>
          <label className="text-xs text-slate-400">Time for 100% pour: {(settings.maxPourMs / 1000).toFixed(1)} s</label>
          <input type="range" min="1000" max="10000" step="250" value={settings.maxPourMs}
            onChange={(e) => updateSettings({ maxPourMs: Number(e.target.value) })} className="w-full accent-indigo-400" />
        </div>

        <label className="flex items-center justify-between text-sm">
          Rinse with water after each drink
          <input type="checkbox" checked={settings.rinseAfter} onChange={(e) => updateSettings({ rinseAfter: e.target.checked })} className="h-5 w-5 accent-indigo-500" />
        </label>
      </div>
    </section>
  );
}
