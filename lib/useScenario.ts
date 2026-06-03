'use client';
import { useCallback, useEffect, useState } from 'react';
import { type Scenario, DEFAULT_SCENARIO, encodeScenario, decodeScenario } from '@/lib/engine';

/**
 * Scenario state with the URL as the source of truth (architecture D-6/D-7).
 * On mount we hydrate from the query string; every change is mirrored back to the URL via
 * history.replaceState, so links are shareable with no backend.
 */
export function useScenario() {
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const q = window.location.search.replace(/^\?/, '');
    if (q) setScenario(decodeScenario(q));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const qs = encodeScenario(scenario);
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [scenario, hydrated]);

  const update = useCallback(
    (patch: Partial<Scenario>) => setScenario((s) => ({ ...s, ...patch })),
    [],
  );

  const reset = useCallback(() => setScenario(DEFAULT_SCENARIO), []);

  return { scenario, update, reset, hydrated };
}
