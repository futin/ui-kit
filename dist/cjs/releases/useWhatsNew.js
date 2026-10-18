"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWhatsNew = useWhatsNew;
// useWhatsNew: the version chip and What's new drawer wiring every app's shell repeated — the read, the unseen dot over localStorage, and the drawer's open
// state (spec Part 2 §Public surface, D17). The storage key is the caller's, so each app keeps the key it already uses and no viewer's dot state resets.
//
// `lastSeen` mirrors the stored value in memory, so storage that throws still settles the dot once the seed has been "written" — otherwise a private window
// would re-seed on every render. Every write goes through `dotState`, which never writes a version below the stored one.
const react_1 = require("react");
const logic_js_1 = require("./logic.js");
const useReleases_js_1 = require("./useReleases.js");
function useWhatsNew(o) {
    const { storageKey } = o;
    const { data, refresh } = (0, useReleases_js_1.useReleases)(o.url);
    const [open, setOpen] = (0, react_1.useState)(false);
    const [lastSeen, setLastSeen] = (0, react_1.useState)(() => (0, logic_js_1.readLastSeen)(storageKey));
    const newest = data?.releases[0]?.version ?? null;
    const { dot, seed } = (0, logic_js_1.dotState)(newest, lastSeen, open);
    (0, react_1.useEffect)(() => {
        if (seed === null)
            return;
        (0, logic_js_1.writeLastSeen)(storageKey, seed);
        setLastSeen(seed);
    }, [seed, storageKey]);
    // Opens at once, without waiting for the refetch, as every app's drawer did before this hook.
    const show = (0, react_1.useCallback)(() => {
        refresh();
        setOpen(true);
    }, [refresh]);
    const close = (0, react_1.useCallback)(() => setOpen(false), []);
    const current = data?.current ?? null;
    return { data, chip: current ? { label: (0, logic_js_1.chipLabel)(current), dot } : null, open, show, close };
}
