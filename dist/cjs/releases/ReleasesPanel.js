"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleasesPanel = ReleasesPanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const logic_js_1 = require("./logic.js");
const notes_js_1 = require("./notes.js");
const notesHtml = (notes, sanitize) => (sanitize ? sanitize((0, notes_js_1.renderNotesHtml)(notes)) : (0, notes_js_1.renderNotesHtml)(notes));
const OTHER = 'Other';
/**
 * A rolled-up release's items by scope, groups in the order their scope first appears and unscoped items last under `Other`. A scope is shown capitalised;
 * release-kit keeps it lowercase on the wire.
 */
function groupByScope(items) {
    const groups = new Map();
    for (const i of items) {
        const key = i.scope ? i.scope.charAt(0).toUpperCase() + i.scope.slice(1) : OTHER;
        groups.set(key, [...(groups.get(key) ?? []), i]);
    }
    const other = groups.get(OTHER);
    groups.delete(OTHER);
    return [...groups, ...(other ? [[OTHER, other]] : [])].map(([label, list]) => ({ label, items: list }));
}
function Item({ i, sanitize }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "uk-releases-item", children: [i.notes !== '' ? ((0, jsx_runtime_1.jsx)("div", { className: "uk-releases-notes", dangerouslySetInnerHTML: { __html: notesHtml(i.notes, sanitize) } })) : ((0, jsx_runtime_1.jsx)("div", { className: "uk-releases-title", children: i.title })), i.url && ((0, jsx_runtime_1.jsxs)("a", { className: "uk-releases-pr", href: i.url, target: "_blank", rel: "noopener noreferrer", children: ["PR #", i.pr] }))] }));
}
function Entry({ r, sanitize }) {
    // The baseline is where numbering starts, not something that shipped: a divider with its words in the gap, no badge, no title — but its date, as every
    // entry has, so the list says when versioning began.
    if (r.type === 'baseline') {
        return ((0, jsx_runtime_1.jsx)("div", { className: "uk-releases-entry", "data-testid": `release-${r.version}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "uk-releases-base", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Versioning starts here \u00B7 v", r.version] }), (0, jsx_runtime_1.jsx)("span", { className: "uk-releases-date", children: (0, logic_js_1.formatReleaseDate)(r.date) })] }) }));
    }
    // A rollup tag never carries a release-level PR, so a night with one PR is still grouped: its notes hold the `### Scope` body and its only link is the
    // item's. A per-PR release (one item, with `pr`), an empty list or an older server's missing list is the per-PR entry below, unchanged.
    const rolledUp = r.items !== undefined && r.items.length > 0 && (r.items.length > 1 || r.pr === undefined) ? r.items : null;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "uk-releases-entry", "data-testid": `release-${r.version}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "uk-releases-row", children: [(0, jsx_runtime_1.jsxs)("span", { className: "uk-releases-ver", children: ["v", r.version] }), (0, jsx_runtime_1.jsx)("span", { className: `uk-releases-badge uk-releases-badge-${r.type}`, children: logic_js_1.TYPE_LABEL[r.type] }), r.breaking && (0, jsx_runtime_1.jsx)("span", { className: "uk-releases-badge uk-releases-badge-breaking", children: "Breaking" }), (0, jsx_runtime_1.jsx)("span", { className: "uk-releases-date", children: (0, logic_js_1.formatReleaseDate)(r.date) })] }), rolledUp ? (groupByScope(rolledUp).map((g) => ((0, jsx_runtime_1.jsxs)("div", { className: "uk-releases-group", children: [(0, jsx_runtime_1.jsx)("div", { className: "uk-releases-scope", children: g.label }), g.items.map((i) => ((0, jsx_runtime_1.jsx)(Item, { i: i, sanitize: sanitize }, i.pr)))] }, g.label)))) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "uk-releases-title", children: (0, logic_js_1.displayTitle)(r.title) }), r.notes !== '' && (0, jsx_runtime_1.jsx)("div", { className: "uk-releases-notes", dangerouslySetInnerHTML: { __html: notesHtml(r.notes, sanitize) } })] })), !rolledUp && r.url && r.pr !== undefined && ((0, jsx_runtime_1.jsxs)("a", { className: "uk-releases-pr", href: r.url, target: "_blank", rel: "noopener noreferrer", children: ["PR #", r.pr] }))] }));
}
function ReleasesPanel({ data, sanitize }) {
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "uk-releases-head", children: [(0, jsx_runtime_1.jsx)("h2", { className: "uk-releases-heading", children: "What's new" }), data.current && (0, jsx_runtime_1.jsxs)("span", { className: "uk-releases-running", children: ["running ", (0, logic_js_1.chipLabel)(data.current)] })] }), (0, jsx_runtime_1.jsx)("div", { className: "uk-releases-list", children: data.releases.map((r) => ((0, jsx_runtime_1.jsx)(Entry, { r: r, sanitize: sanitize }, r.version))) })] }));
}
