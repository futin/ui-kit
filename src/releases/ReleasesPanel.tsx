// The What's new drawer's content (spec D16): one markup for every app, guide-manager's. The order is the response's — the reader already sorts newest
// first — and nothing here re-sorts it.
import type { Release, ReleasesResponse } from '../types.js';
import { chipLabel, displayTitle, formatReleaseDate, TYPE_LABEL } from './logic.js';
import { renderNotesHtml } from './notes.js';

export type ReleasesPanelProps = {
  data: ReleasesResponse;
  /**
   * The host's own sanitising pass, run over `renderNotesHtml`'s output before it is set as HTML. Notes always render through ui-kit's one renderer so
   * every app's drawer reads the same; a host whose policy needs more (guide-manager's second sanitising wall) adds it here and cannot replace the markup.
   */
  sanitize?: (html: string) => string;
};

function Entry({ r, sanitize }: { r: Release; sanitize?: (html: string) => string }) {
  // The baseline is where numbering starts, not something that shipped: a divider with its words in the gap, no badge, no title — but its date, as every
  // entry has, so the list says when versioning began.
  if (r.type === 'baseline') {
    return (
      <div className="uk-releases-entry" data-testid={`release-${r.version}`}>
        <div className="uk-releases-base">
          <span>Versioning starts here · v{r.version}</span>
          <span className="uk-releases-date">{formatReleaseDate(r.date)}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="uk-releases-entry" data-testid={`release-${r.version}`}>
      <div className="uk-releases-row">
        <span className="uk-releases-ver">v{r.version}</span>
        <span className={`uk-releases-badge uk-releases-badge-${r.type}`}>{TYPE_LABEL[r.type]}</span>
        {r.breaking && <span className="uk-releases-badge uk-releases-badge-breaking">Breaking</span>}
        <span className="uk-releases-date">{formatReleaseDate(r.date)}</span>
      </div>
      <div className="uk-releases-title">{displayTitle(r.title)}</div>
      {r.notes !== '' && (
        <div
          className="uk-releases-notes"
          dangerouslySetInnerHTML={{ __html: sanitize ? sanitize(renderNotesHtml(r.notes)) : renderNotesHtml(r.notes) }}
        />
      )}
      {r.url && r.pr !== undefined && (
        <a className="uk-releases-pr" href={r.url} target="_blank" rel="noopener noreferrer">
          PR #{r.pr}
        </a>
      )}
    </div>
  );
}

export function ReleasesPanel({ data, sanitize }: ReleasesPanelProps) {
  return (
    <>
      <div className="uk-releases-head">
        <h2 className="uk-releases-heading">What's new</h2>
        {data.current && <span className="uk-releases-running">running {chipLabel(data.current)}</span>}
      </div>
      <div className="uk-releases-list">
        {data.releases.map((r) => (
          <Entry key={r.version} r={r} sanitize={sanitize} />
        ))}
      </div>
    </>
  );
}
