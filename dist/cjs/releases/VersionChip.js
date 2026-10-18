"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionChip = VersionChip;
const jsx_runtime_1 = require("react/jsx-runtime");
function VersionChip({ label, dot, onClick, className }) {
    return ((0, jsx_runtime_1.jsxs)("button", { type: "button", className: className ? `uk-chip ${className}` : 'uk-chip', "aria-label": dot ? `What's new — ${label}, new release` : `What's new — ${label}`, onClick: onClick, children: [(0, jsx_runtime_1.jsx)("span", { className: "uk-chip-label", children: label }), dot && (0, jsx_runtime_1.jsx)("span", { className: "uk-chip-dot", "aria-hidden": "true" })] }));
}
