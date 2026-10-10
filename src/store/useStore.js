import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';
import { ble } from '../services/ble.js';
import { wifi } from '../services/ws.js';
import { askGemini } from '../services/gemini.js';
import { mergeFlavors } from '../utils/flavors.js';
import { buildPayload, emptyLevels, msToPct, payloadDuration } from '../utils/payload.js';

const IDLE = { active: false, label: '', durationMs: 0, startedAt: 0 };

// Web Bluetooth needs HTTPS. When the app is hosted on the ESP32 (plain http) use Wi-Fi.
const defaultTransport = () =>
  Capacitor.isNativePlatform() ||
  typeof navigator !== 'undefined' && navigator.bluetooth && window.isSecureContext ? 'ble' : 'wifi';
const pick = (settings) => ((settings.transport ?? defaultTransport()) === 'wifi' ? wifi : ble);
let active = ble; // transport currently in use

export const useStore = create(
  persist(
    (set, get) => ({
      // ---- persisted ----
      recipes: [], // [{ id, name, levels:{[id]:pct} }]
      settings: { geminiKey: '', maxPourMs: 5000, flushMs: 3000, rinseAfter: true, transport: defaultTransport(), wsHost: '', geminiModel: 'gemini-2.5-flash' },
      flavorOverrides: {}, // { [pumpId]: { name, color, tags } } user renames

      // ---- session ----
      levels: emptyLevels(), // current mix, percent per pump
      conn: { status: 'disconnected', name: null }, // disconnected | connecting | connected
      dispense: IDLE,
      ai: { loading: false, result: null, error: null },
      toast: null, // { type: 'error' | 'success' | 'info', text }

      // ---- ui helpers ----
      notify: (type, text) => set({ toast: { type, text, key: Date.now() } }),
      clearToast: () => set({ toast: null }),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      // ---- flavor renaming ----
      setFlavor: (id, patch) =>
        set((s) => ({ flavorOverrides: { ...s.flavorOverrides, [id]: { ...s.flavorOverrides[id], ...patch } } })),
      resetFlavor: (id) =>
        set((s) => {
          const { [id]: _removed, ...rest } = s.flavorOverrides;
          return { flavorOverrides: rest };
        }),

      // ---- mix ----
      setLevel: (id, pct) =>
        set((s) => ({ levels: { ...s.levels, [id]: Math.max(0, Math.min(100, pct)) } })),
      resetLevels: () => set({ levels: emptyLevels() }),

      // ---- recipes ----
      saveRecipe: (name) => {
        const { levels, recipes, notify } = get();
        if (!name.trim()) return notify('error', 'Give your recipe a name.');
        if (Object.values(levels).every((v) => v === 0))
          return notify('error', 'Add at least one flavor first.');
        set({ recipes: [{ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), name: name.trim(), levels: { ...levels } }, ...recipes] });
        notify('success', `Saved "${name.trim()}"`);
      },
      deleteRecipe: (id) => set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) })),
      loadLevels: (levels) => set({ levels: { ...emptyLevels(), ...levels } }),

      // ---- hardware ----
      connect: async () => {
        set({ conn: { status: 'connecting', name: null } });
        try {
          const { settings } = get();
          active = pick(settings);
          const name = await active.connect({
            host: settings.wsHost,
            onDisconnect: () => {
              set({ conn: { status: 'disconnected', name: null }, dispense: IDLE });
              get().notify('error', 'Dispenser disconnected.');
            },
            onMessage: (msg) => {
              if (msg.status === 'DONE') get().finishDispense();
              if (msg.status === 'ERROR') {
                get().finishDispense();
                get().notify('error', `Dispenser error: ${msg.message || 'unknown'}`);
              }
            },
          });
          set({ conn: { status: 'connected', name } });
          get().notify('success', `Connected to ${name}`);
        } catch (e) {
          set({ conn: { status: 'disconnected', name: null } });
          get().notify('error', e.message);
        }
      },
      disconnect: () => {
        active.disconnect();
        set({ conn: { status: 'disconnected', name: null } });
      },

      /** Sends any payload to the ESP32 with full error handling. */
      runPayload: async (payload, label) => {
        const { conn, notify, dispense } = get();
        if (conn.status !== 'connected') return notify('error', 'Dispenser not connected. Tap Connect first.');
        if (dispense.active) return notify('info', 'Already dispensing…');
        const durationMs = payloadDuration(payload);
        if (durationMs === 0) return notify('error', 'Nothing to dispense.');
        try {
          await active.send(payload);
          set({ dispense: { active: true, label, durationMs, startedAt: Date.now() } });
        } catch (e) {
          set({ conn: { status: 'disconnected', name: null } });
          notify('error', e.message);
        }
      },
      finishDispense: () => set({ dispense: IDLE }),

      dispenseLevels: (levels, label) => {
        const { settings, runPayload } = get();
        return runPayload(
          buildPayload({
            levels,
            maxPourMs: settings.maxPourMs,
            flushMs: settings.rinseAfter ? settings.flushMs : 0,
          }),
          label
        );
      },
      dispenseCurrent: () => get().dispenseLevels(get().levels, 'Your mix'),

      flush: () => {
        const { settings, runPayload } = get();
        return runPayload(
          buildPayload({ command: 'FLUSH', levels: emptyLevels(), maxPourMs: settings.maxPourMs, flushMs: settings.flushMs }),
          'Flushing lines'
        );
      },

      // ---- AI ----
      askAI: async (prompt) => {
        const { settings, notify } = get();
        if (!prompt.trim()) return notify('error', 'Describe the drink you want.');
        set({ ai: { loading: true, result: null, error: null } });
        try {
          const r = await askGemini({
            prompt,
            apiKey: settings.geminiKey,
            maxPourMs: settings.maxPourMs,
            model: settings.geminiModel,
            flavors: mergeFlavors(get().flavorOverrides), // AI sees your renamed flavors
          });
          const levels = Object.fromEntries(
            Object.entries(r.times).map(([id, ms]) => [id, msToPct(ms, settings.maxPourMs)])
          );
          set({ ai: { loading: false, result: { ...r, levels }, error: null } });
        } catch (e) {
          set({ ai: { loading: false, result: null, error: e.message } });
        }
      },
    }),
    {
      name: 'flavor-dispenser',
      // keep new default settings when older saved settings lack them
      merge: (saved, current) => ({ ...current, ...saved, settings: { ...current.settings, ...saved?.settings } }),
      partialize: (s) => ({ recipes: s.recipes, settings: s.settings, flavorOverrides: s.flavorOverrides }),
    }
  )
);
