import { jsx as _jsx } from "react/jsx-runtime";
import { Drawer } from '../ui/Drawer.js';
import { ReleasesPanel } from './ReleasesPanel.js';
export function ReleasesDrawer({ data, renderNotes, onClose, closeOnEscape, narrow, restoreFocus }) {
    return (_jsx(Drawer, { label: "What's new", onClose: onClose, closeOnEscape: closeOnEscape, narrow: narrow, restoreFocus: restoreFocus, children: _jsx(ReleasesPanel, { data: data, renderNotes: renderNotes }) }));
}
