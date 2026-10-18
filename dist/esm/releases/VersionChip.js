import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function VersionChip({ label, dot, onClick, className }) {
    return (_jsxs("button", { type: "button", className: className ? `uk-chip ${className}` : 'uk-chip', "aria-label": dot ? `What's new — ${label}, new release` : `What's new — ${label}`, onClick: onClick, children: [_jsx("span", { className: "uk-chip-label", children: label }), dot && _jsx("span", { className: "uk-chip-dot", "aria-hidden": "true" })] }));
}
