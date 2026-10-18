import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { chipLabel, displayTitle, formatReleaseDate, TYPE_LABEL } from './logic.js';
import { renderNotesHtml } from './notes.js';
function Entry({ r, renderNotes }) {
    // The baseline is where numbering starts, not something that shipped: a divider with its words in the gap, no badge, no title — but its date, as every
    // entry has, so the list says when versioning began.
    if (r.type === 'baseline') {
        return (_jsx("div", { className: "uk-releases-entry", "data-testid": `release-${r.version}`, children: _jsxs("div", { className: "uk-releases-base", children: [_jsxs("span", { children: ["Versioning starts here \u00B7 v", r.version] }), _jsx("span", { className: "uk-releases-date", children: formatReleaseDate(r.date) })] }) }));
    }
    return (_jsxs("div", { className: "uk-releases-entry", "data-testid": `release-${r.version}`, children: [_jsxs("div", { className: "uk-releases-row", children: [_jsxs("span", { className: "uk-releases-ver", children: ["v", r.version] }), _jsx("span", { className: `uk-releases-badge uk-releases-badge-${r.type}`, children: TYPE_LABEL[r.type] }), r.breaking && _jsx("span", { className: "uk-releases-badge uk-releases-badge-breaking", children: "Breaking" }), _jsx("span", { className: "uk-releases-date", children: formatReleaseDate(r.date) })] }), _jsx("div", { className: "uk-releases-title", children: displayTitle(r.title) }), r.notes !== '' &&
                (renderNotes ? (_jsx("div", { className: "uk-releases-notes", children: renderNotes(r.notes) })) : (_jsx("div", { className: "uk-releases-notes", dangerouslySetInnerHTML: { __html: renderNotesHtml(r.notes) } }))), r.url && r.pr !== undefined && (_jsxs("a", { className: "uk-releases-pr", href: r.url, target: "_blank", rel: "noopener noreferrer", children: ["PR #", r.pr] }))] }));
}
export function ReleasesPanel({ data, renderNotes }) {
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "uk-releases-head", children: [_jsx("h2", { className: "uk-releases-heading", children: "What's new" }), data.current && _jsxs("span", { className: "uk-releases-running", children: ["running ", chipLabel(data.current)] })] }), _jsx("div", { className: "uk-releases-list", children: data.releases.map((r) => (_jsx(Entry, { r: r, renderNotes: renderNotes }, r.version))) })] }));
}
