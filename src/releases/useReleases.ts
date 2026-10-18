// useReleases: the one read of an app's releases route, for the version chip and the What's new drawer (spec Part 2 §Public surface). Ported from
// guide-manager's client/src/hooks/useReleases.ts; the one change is that the url is a parameter.
//
// Read on mount and on `refresh()` — which the host calls as the drawer opens — and never on a timer: a version changes only when the server's checkout
// moves, so a poll would spend requests on a question whose answer cannot change under an open tab often enough to matter. A failed read, or one whose body
// is not the releases shape (a stale server without the route answers the SPA's index.html), keeps the last good answer — `null` before one — so a blip
// never takes the chip away. An answer that lands after unmount is dropped.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReleasesResponse } from '../types.js';
import { isReleasesResponse } from './logic.js';

export function useReleases(url = '/api/releases'): { data: ReleasesResponse | null; refresh: () => void } {
  const [data, setData] = useState<ReleasesResponse | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(() => {
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((body: unknown) => {
        if (mounted.current && isReleasesResponse(body)) setData(body);
      })
      .catch(() => {
        /* keep the previous answer */
      });
  }, [url]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, refresh };
}
