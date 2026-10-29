// The What's new drawer's content (spec D16): one markup for every app, guide-manager's. The order is the response's — the reader already sorts newest
// first — and nothing here re-sorts it.
import type { Release, ReleaseItem, ReleasesResponse } from '../types.js';
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

const notesHtml = (notes: string, sanitize?: (html: string) => string): string => (sanitize ? sanitize(renderNotesHtml(notes)) : renderNotesHtml(notes));

const OTHER = 'Other';

/**
 * A rolled-up release's items by scope, groups in the order their scope first appears and unscoped items last under `Other`. A scope is shown capitalised;
 * release-kit keeps it lowercase on the wire.
 */
function groupByScope(items: ReleaseItem[]): { label: string; items: ReleaseItem[] }[] {
  const groups = new Map<string, ReleaseItem[]>();
  for (const i of items) {
    const key = i.scope ? i.scope.charAt(0).toUpperCase() + i.scope.slice(1) : OTHER;
    groups.set(key, [...(groups.get(key) ?? []), i]);
  }
  const other = groups.get(OTHER);
  groups.delete(OTHER);
  return [...groups, ...(other ? [[OTHER, other] as const] : [])].map(([label, list]) => ({ label, items: list }));
}

function Item({ i, sanitize }: { i: ReleaseItem; sanitize?: (html: string) => string }) {
  return (
    <div className="uk-releases-item">
      {i.notes !== '' ? (
        <div className="uk-releases-notes" dangerouslySetInnerHTML={{ __html: notesHtml(i.notes, sanitize) }} />
      ) : (
        <div className="uk-releases-title">{i.title}</div>
      )}
      {i.url && (
        <a className="uk-releases-pr" href={i.url} target="_blank" rel="noopener noreferrer">
          PR #{i.pr}
        </a>
      )}
    </div>
  );
}

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
  // A rollup tag never carries a release-level PR, so a night with one PR is still grouped: its notes hold the `### Scope` body and its only link is the
  // item's. A per-PR release (one item, with `pr`), an empty list or an older server's missing list is the per-PR entry below, unchanged.
  const rolledUp = r.items !== undefined && r.items.length > 0 && (r.items.length > 1 || r.pr === undefined) ? r.items : null;
  return (
    <div className="uk-releases-entry" data-testid={`release-${r.version}`}>
      <div className="uk-releases-row">
        <span className="uk-releases-ver">v{r.version}</span>
        <span className={`uk-releases-badge uk-releases-badge-${r.type}`}>{TYPE_LABEL[r.type]}</span>
        {r.breaking && <span className="uk-releases-badge uk-releases-badge-breaking">Breaking</span>}
        <span className="uk-releases-date">{formatReleaseDate(r.date)}</span>
      </div>
      {rolledUp ? (
        groupByScope(rolledUp).map((g) => (
          <div key={g.label} className="uk-releases-group">
            <div className="uk-releases-scope">{g.label}</div>
            {g.items.map((i) => (
              <Item key={i.pr} i={i} sanitize={sanitize} />
            ))}
          </div>
        ))
      ) : (
        <>
          <div className="uk-releases-title">{displayTitle(r.title)}</div>
          {r.notes !== '' && <div className="uk-releases-notes" dangerouslySetInnerHTML={{ __html: notesHtml(r.notes, sanitize) }} />}
        </>
      )}
      {!rolledUp && r.url && r.pr !== undefined && (
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
