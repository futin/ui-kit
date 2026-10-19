"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleasesPanel = ReleasesPanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const logic_js_1 = require("./logic.js");
const notes_js_1 = require("./notes.js");
function Entry({ r, sanitize }) {
    // The baseline is where numbering starts, not something that shipped: a divider with its words in the gap, no badge, no title — but its date, as every
    // entry has, so the list says when versioning began.
    if (r.type === 'baseline') {
        return ((0, jsx_runtime_1.jsx)("div", { className: "uk-releases-entry", "data-testid": `release-${r.version}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "uk-releases-base", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Versioning starts here \u00B7 v", r.version] }), (0, jsx_runtime_1.jsx)("span", { className: "uk-releases-date", children: (0, logic_js_1.formatReleaseDate)(r.date) })] }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "uk-releases-entry", "data-testid": `release-${r.version}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "uk-releases-row", children: [(0, jsx_runtime_1.jsxs)("span", { className: "uk-releases-ver", children: ["v", r.version] }), (0, jsx_runtime_1.jsx)("span", { className: `uk-releases-badge uk-releases-badge-${r.type}`, children: logic_js_1.TYPE_LABEL[r.type] }), r.breaking && (0, jsx_runtime_1.jsx)("span", { className: "uk-releases-badge uk-releases-badge-breaking", children: "Breaking" }), (0, jsx_runtime_1.jsx)("span", { className: "uk-releases-date", children: (0, logic_js_1.formatReleaseDate)(r.date) })] }), (0, jsx_runtime_1.jsx)("div", { className: "uk-releases-title", children: (0, logic_js_1.displayTitle)(r.title) }), r.notes !== '' && ((0, jsx_runtime_1.jsx)("div", { className: "uk-releases-notes", dangerouslySetInnerHTML: { __html: sanitize ? sanitize((0, notes_js_1.renderNotesHtml)(r.notes)) : (0, notes_js_1.renderNotesHtml)(r.notes) } })), r.url && r.pr !== undefined && ((0, jsx_runtime_1.jsxs)("a", { className: "uk-releases-pr", href: r.url, target: "_blank", rel: "noopener noreferrer", children: ["PR #", r.pr] }))] }));
}
function ReleasesPanel({ data, sanitize }) {
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "uk-releases-head", children: [(0, jsx_runtime_1.jsx)("h2", { className: "uk-releases-heading", children: "What's new" }), data.current && (0, jsx_runtime_1.jsxs)("span", { className: "uk-releases-running", children: ["running ", (0, logic_js_1.chipLabel)(data.current)] })] }), (0, jsx_runtime_1.jsx)("div", { className: "uk-releases-list", children: data.releases.map((r) => ((0, jsx_runtime_1.jsx)(Entry, { r: r, sanitize: sanitize }, r.version))) })] }));
}
