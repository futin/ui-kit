"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleasesDrawer = ReleasesDrawer;
const jsx_runtime_1 = require("react/jsx-runtime");
const Drawer_js_1 = require("../ui/Drawer.js");
const ReleasesPanel_js_1 = require("./ReleasesPanel.js");
function ReleasesDrawer({ data, renderNotes, onClose, closeOnEscape, narrow, restoreFocus }) {
    return ((0, jsx_runtime_1.jsx)(Drawer_js_1.Drawer, { label: "What's new", onClose: onClose, closeOnEscape: closeOnEscape, narrow: narrow, restoreFocus: restoreFocus, children: (0, jsx_runtime_1.jsx)(ReleasesPanel_js_1.ReleasesPanel, { data: data, renderNotes: renderNotes }) }));
}
