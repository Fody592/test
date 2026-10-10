import { useRef, useState } from 'react';
import { useFlavors } from '../utils/flavors.js';
import { useStore } from '../store/useStore.js';

const IDEAS = ['Something tropical and sweet', 'Surprise me with a sour zero-sugar blend', 'Cool and minty, like a mojito', 'Classic cherry cola with a twist'];

/** AI tab: text/voice prompt -> Gemini -> recipe preview -> apply or pour. */
export default function AiSommelier({ goToMix }) {
  const { ai, askAI, loadLevels, dispenseLevels, saveRecipe } = useStore();
  const FLAVORS = useFlavors();
  const [prompt, setPrompt] = useState('');
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  // Voice input via Web Speech API (Chrome). Silently hidden where unsupported.
  const SR = typeof window !== 'undefined' && window.isSecureContext && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const toggleMic = () => {
    if (listening) return recRef.current?.stop();
    const rec = new SR();
    rec.lang = 'en-US';
    rec.onresult = (e) => setPrompt(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const r = ai.result;
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="font-bold">✨ Gemini Sommelier</h2>
        <textarea
          rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the drink you want…"
          className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-indigo-500"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {IDEAS.map((i) => (
            <button key={i} onClick={() => setPrompt(i)} className="rounded-full bg-slate-800 px-3 py-1 text-xs active:scale-95">{i}</button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          {SR && (
            <button onClick={toggleMic} className={`rounded-lg px-4 py-2 text-lg active:scale-95 ${listening ? 'animate-pulse bg-rose-600' : 'bg-slate-800'}`} aria-label="Voice input">🎤</button>
          )}
          <button
            disabled={ai.loading} onClick={() => askAI(prompt)}
            className="flex-1 rounded-lg bg-indigo-600 py-2 font-bold active:scale-95 disabled:opacity-50"
          >{ai.loading ? 'Thinking…' : 'Create recipe'}</button>
        </div>
      </div>

      {ai.error && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">{ai.error}</div>}

      {r && (
        <div className="rounded-2xl border border-indigo-500/50 bg-slate-900 p-4">
          <h3 className="text-lg font-bold">{r.name}</h3>
          <p className="mt-1 text-sm text-slate-300">{r.description}</p>
          <ul className="mt-3 space-y-2">
            {FLAVORS.filter((f) => r.times[f.id] > 0).map((f) => (
              <li key={f.id}>
                <div className="flex justify-between text-xs"><span>{f.name}</span><span className="tabular-nums text-slate-400">{r.times[f.id]} ms</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full" style={{ width: `${r.levels[f.id]}%`, background: f.color }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <button onClick={() => { loadLevels(r.levels); goToMix(); }} className="flex-1 rounded-lg bg-slate-800 py-2 text-sm active:scale-95">Tweak</button>
            <button onClick={() => { loadLevels(r.levels); saveRecipe(r.name); }} className="flex-1 rounded-lg bg-slate-800 py-2 text-sm active:scale-95">Save</button>
            <button onClick={() => dispenseLevels(r.levels, r.name)} className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-bold active:scale-95">Pour</button>
          </div>
        </div>
      )}
    </section>
  );
}
