import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The drawer shell (spec D15). It accepts the host's dismiss and focus layer instead of owning one: a host with its own Escape stack passes
// closeOnEscape={false} and handles the key itself, and a host whose opener can disappear picks the focus target through restoreFocus.
import { useEffect, useRef } from 'react';
export function Drawer({ label, onClose, children, closeOnEscape = true, narrow = false, restoreFocus }) {
    const panel = useRef(null);
    // Latest props for the effects below, so a host passing a fresh onClose or restoreFocus each render neither re-attaches the listener nor re-runs focus.
    const latest = useRef({ onClose, restoreFocus });
    latest.current = { onClose, restoreFocus };
    useEffect(() => {
        if (!closeOnEscape)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape')
                latest.current.onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [closeOnEscape]);
    useEffect(() => {
        const prev = document.activeElement;
        panel.current?.focus();
        return () => {
            const restore = latest.current.restoreFocus;
            if (restore === false)
                return;
            const target = restore ? restore(prev) : prev?.isConnected ? prev : null;
            target?.focus?.();
        };
    }, []);
    const onScrim = (e) => {
        if (e.target === e.currentTarget)
            onClose();
    };
    return (_jsx("div", { className: "uk-drawer-scrim", onClick: onScrim, children: _jsxs("aside", { ref: panel, className: narrow ? 'uk-drawer uk-drawer--narrow' : 'uk-drawer', role: "dialog", "aria-modal": "true", "aria-label": label, tabIndex: -1, children: [_jsx("button", { type: "button", className: "uk-drawer-close", "aria-label": "Close", onClick: onClose, children: "\u2715" }), children] }) }));
}
