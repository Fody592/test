import { useMemo } from 'react';
import { FLAVORS } from '../constants/flavors.js';
import { useStore } from '../store/useStore.js';

/** Defaults + user renames. Pump `id` never changes, only name/color/tags. */
export const mergeFlavors = (overrides = {}) =>
  FLAVORS.map((f) => ({ ...f, ...(overrides[f.id] || {}) }));

/** React hook: the 19 flavors with the user's custom names applied. */
export function useFlavors() {
  const overrides = useStore((s) => s.flavorOverrides);
  return useMemo(() => mergeFlavors(overrides), [overrides]);
}
