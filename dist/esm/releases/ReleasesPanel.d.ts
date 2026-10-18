import type { ReactNode } from 'react';
import type { ReleasesResponse } from '../types.js';
export type ReleasesPanelProps = {
    data: ReleasesResponse;
    /**
     * The host's own notes renderer (spec D14). Its output goes inside `.uk-releases-notes`; a host whose renderer returns an HTML string wraps it in its
     * own `dangerouslySetInnerHTML` element. Default: `renderNotesHtml`, escape-first, safe with no sanitiser behind it.
     */
    renderNotes?: (notes: string) => ReactNode;
};
export declare function ReleasesPanel({ data, renderNotes }: ReleasesPanelProps): import("react").JSX.Element;
