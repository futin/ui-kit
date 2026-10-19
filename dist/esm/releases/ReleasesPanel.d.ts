import type { ReleasesResponse } from '../types.js';
export type ReleasesPanelProps = {
    data: ReleasesResponse;
    /**
     * The host's own sanitising pass, run over `renderNotesHtml`'s output before it is set as HTML. Notes always render through ui-kit's one renderer so
     * every app's drawer reads the same; a host whose policy needs more (guide-manager's second sanitising wall) adds it here and cannot replace the markup.
     */
    sanitize?: (html: string) => string;
};
export declare function ReleasesPanel({ data, sanitize }: ReleasesPanelProps): import("react").JSX.Element;
