'use client';
import { useEffect, useState } from 'react';

/** Fetches `url` now and then every `ms` milliseconds, unless paused. */
export function usePolling<T>(url: string, ms: number, paused: boolean) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
        if (!stopped) {
          setData(body as T);
          setError(null);
        }
      } catch (e) {
        if (!stopped) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!stopped && !paused) timer = setTimeout(tick, ms);
      }
    };

    tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [url, ms, paused]);

  return { data, error };
}
