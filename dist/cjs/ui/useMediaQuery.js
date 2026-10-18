"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMediaQuery = useMediaQuery;
// Whether a media query matches, kept current through its change events. The shipped CSS has no media queries (spec D13), so a host derives the drawer's
// `narrow` from its own breakpoint with this: `narrow={useMediaQuery('(max-width: 700px)')}`.
const react_1 = require("react");
const hasMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';
/** `false` where `matchMedia` is missing — on the server, in jsdom — so a host renders its wide shape there. */
function useMediaQuery(query) {
    // Keyed on the query, so a re-render with the same query keeps its one listener instead of re-subscribing.
    const subscribe = (0, react_1.useCallback)((onChange) => {
        if (!hasMatchMedia())
            return () => { };
        const mql = window.matchMedia(query);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [query]);
    const get = () => hasMatchMedia() && window.matchMedia(query).matches;
    return (0, react_1.useSyncExternalStore)(subscribe, get, () => false);
}
