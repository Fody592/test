import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore.js';

/** Full-screen progress while dispensing. Closes on ESP32 "DONE" or when time runs out. */
export default function DispenseOverlay() {
  const { active, label, durationMs, startedAt } = useStore((s) => s.dispense);
  const finish = useStore((s) => s.finishDispense);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf;
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      setPct(Math.min(100, (elapsed / durationMs) * 100));
      if (elapsed >= durationMs + 1500) return finish(); // grace period for BLE DONE msg
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [active, startedAt, durationMs, finish]);

  if (!active) return null;
  const done = pct >= 100;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-950/95 p-8 backdrop-blur">
      <div className={`text-7xl ${done ? '' : 'animate-bounce'}`}>{done ? '✅' : '🥤'}</div>
      <h2 className="text-2xl font-bold">{done ? 'Almost done…' : `Dispensing ${label}`}</h2>
      <div className="h-4 w-full max-w-sm overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-[width] duration-100" style={{ width: `${pct}%` }} />
      </div>
      <button onClick={finish} className="text-sm text-slate-400 underline">Hide</button>
    </div>
  );
}
