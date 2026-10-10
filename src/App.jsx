import { useState } from 'react';
import ConnectionBar from './components/ConnectionBar.jsx';
import FlavorGrid from './components/FlavorGrid.jsx';
import SavedRecipes from './components/SavedRecipes.jsx';
import AiSommelier from './components/AiSommelier.jsx';
import Maintenance from './components/Maintenance.jsx';
import DispenseOverlay from './components/DispenseOverlay.jsx';
import Toast from './components/Toast.jsx';

const TABS = [
  { id: 'mix', icon: '🎛️', label: 'Mix' },
  { id: 'recipes', icon: '📖', label: 'Recipes' },
  { id: 'ai', icon: '✨', label: 'AI' },
  { id: 'maint', icon: '🧼', label: 'Maintain' },
];

export default function App() {
  const [tab, setTab] = useState('mix');
  const goToMix = () => setTab('mix');

  return (
    <div className="mx-auto min-h-screen max-w-xl">
      <ConnectionBar />
      <main className="p-4 pb-28">
        {tab === 'mix' && <FlavorGrid />}
        {tab === 'recipes' && <SavedRecipes goToMix={goToMix} />}
        {tab === 'ai' && <AiSommelier goToMix={goToMix} />}
        {tab === 'maint' && <Maintenance />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-xl border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex h-[68px] flex-1 flex-col items-center justify-center gap-0.5 text-xs ${tab === t.id ? 'text-indigo-400' : 'text-slate-500'}`}>
            <span className="text-xl">{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>

      <DispenseOverlay />
      <Toast />
    </div>
  );
}
