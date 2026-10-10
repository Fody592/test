import { FLAVORS } from '../constants/flavors.js';

/** All pumps at 0%. */
export const emptyLevels = () =>
  Object.fromEntries(FLAVORS.map((f) => [f.id, 0]));

/** Percent (0-100) -> pour time in ms. */
export const pctToMs = (pct, maxPourMs) =>
  Math.round((Math.max(0, Math.min(100, pct)) / 100) * maxPourMs);

/** Pour time in ms -> percent (0-100). */
export const msToPct = (ms, maxPourMs) =>
  Math.round((Math.max(0, Math.min(maxPourMs, ms)) / maxPourMs) * 100);

/**
 * Build the exact JSON the ESP32-S3 expects:
 * { command, pumps:[{id,time_ms} x19], flush_water_ms }
 */
export function buildPayload({ command = 'DISPENSE', levels, maxPourMs, flushMs = 0 }) {
  return {
    command,
    pumps: FLAVORS.map((f) => ({
      id: f.id,
      time_ms: command === 'FLUSH' ? 0 : pctToMs(levels[f.id] ?? 0, maxPourMs),
    })),
    flush_water_ms: Math.max(0, Math.round(flushMs)),
  };
}

/** Total run time = slowest pump + water rinse (firmware runs them in sequence). */
export const payloadDuration = (p) =>
  Math.max(0, ...p.pumps.map((x) => x.time_ms)) + p.flush_water_ms;
