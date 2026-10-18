"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useReleases = useReleases;
// useReleases: the one read of an app's releases route, for the version chip and the What's new drawer (spec Part 2 §Public surface). Ported from
// guide-manager's client/src/hooks/useReleases.ts; the one change is that the url is a parameter.
//
// Read on mount and on `refresh()` — which the host calls as the drawer opens — and never on a timer: a version changes only when the server's checkout
// moves, so a poll would spend requests on a question whose answer cannot change under an open tab often enough to matter. A failed read, or one whose body
// is not the releases shape (a stale server without the route answers the SPA's index.html), keeps the last good answer — `null` before one — so a blip
// never takes the chip away. An answer that lands after unmount is dropped.
const react_1 = require("react");
const logic_js_1 = require("./logic.js");
function useReleases(url = '/api/releases') {
    const [data, setData] = (0, react_1.useState)(null);
    const mounted = (0, react_1.useRef)(true);
    (0, react_1.useEffect)(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    const refresh = (0, react_1.useCallback)(() => {
        fetch(url)
            .then((res) => (res.ok ? res.json() : null))
            .then((body) => {
            if (mounted.current && (0, logic_js_1.isReleasesResponse)(body))
                setData(body);
        })
            .catch(() => {
            /* keep the previous answer */
        });
    }, [url]);
    (0, react_1.useEffect)(() => {
        refresh();
    }, [refresh]);
    return { data, refresh };
}
