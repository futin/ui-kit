import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function VersionChip({ label, dot, onClick, narrow }) {
    return (_jsxs("button", { type: "button", className: narrow ? 'uk-chip uk-chip--narrow' : 'uk-chip', "aria-label": dot ? `What's new — ${label}, new release` : `What's new — ${label}`, onClick: onClick, children: [_jsx("span", { className: "uk-chip-label", children: label }), dot && _jsx("span", { className: "uk-chip-dot", "aria-hidden": "true" })] }));
}
