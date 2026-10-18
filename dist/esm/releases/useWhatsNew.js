// useWhatsNew: the version chip and What's new drawer wiring every app's shell repeated — the read, the unseen dot over localStorage, and the drawer's open
// state (spec Part 2 §Public surface, D17). The storage key is the caller's, so each app keeps the key it already uses and no viewer's dot state resets.
//
// `lastSeen` mirrors the stored value in memory, so storage that throws still settles the dot once the seed has been "written" — otherwise a private window
// would re-seed on every render. Every write goes through `dotState`, which never writes a version below the stored one.
import { useCallback, useEffect, useState } from 'react';
import { chipLabel, dotState, readLastSeen, writeLastSeen } from './logic.js';
import { useReleases } from './useReleases.js';
export function useWhatsNew(o) {
    const { storageKey } = o;
    const { data, refresh } = useReleases(o.url);
    const [open, setOpen] = useState(false);
    const [lastSeen, setLastSeen] = useState(() => readLastSeen(storageKey));
    const newest = data?.releases[0]?.version ?? null;
    const { dot, seed } = dotState(newest, lastSeen, open);
    useEffect(() => {
        if (seed === null)
            return;
        writeLastSeen(storageKey, seed);
        setLastSeen(seed);
    }, [seed, storageKey]);
    // Opens at once, without waiting for the refetch, as every app's drawer did before this hook.
    const show = useCallback(() => {
        refresh();
        setOpen(true);
    }, [refresh]);
    const close = useCallback(() => setOpen(false), []);
    const current = data?.current ?? null;
    return { data, chip: current ? { label: chipLabel(current), dot } : null, open, show, close };
}
