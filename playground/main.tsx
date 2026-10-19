// The dev-only playground (spec D18): every shared fixture, under each of three approximate app themes, as a chip and an open panel, plus a button that
// opens a real ReleasesDrawer. Styles come in the way a host's do — ui-kit's stylesheet once, then the host's token map — never from a component.
/// <reference types="vite/client" />
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/styles.css';
import './themes.css';
import { chipLabel, ReleasesDrawer, ReleasesPanel, useMediaQuery, VersionChip } from '../src/index.js';
import type { ReleasesResponse } from '../src/index.js';
import * as fixtures from '../fixtures/releases.js';
import { NOTES_ALL_CONSTRUCTS } from '../fixtures/notes.js';

const THEMES = [
  { id: 'guide-manager', label: 'guide-manager (midnight)' },
  { id: 'backlog-manager', label: 'backlog-manager (daylight)' },
  { id: 'dashboard', label: 'dashboard (graphite)' },
] as const;

type Theme = (typeof THEMES)[number]['id'];

// Every construct the notes renderer emits, in one release. Not in `fixtures/releases.ts`: that file holds only ReleasesResponse values and the loop below
// renders each of them as a chip and a panel.
const ALL_CONSTRUCTS: ReleasesResponse = {
  current: { version: '1.0.0', ahead: 0 },
  releases: [{ version: '1.0.0', date: '2026-10-19T10:00:00Z', title: 'Every notes construct', type: 'feat', breaking: false, notes: NOTES_ALL_CONSTRUCTS }],
};

const FIXTURES = Object.entries(fixtures) as [string, ReleasesResponse][];

function Fixture({ name, data }: { name: string; data: ReleasesResponse }) {
  // The chip's dot is shown wherever there is a release to be unseen, so both chip states appear on every theme.
  const label = data.current ? chipLabel(data.current) : 'v—';
  return (
    <section className="pg-fixture">
      <div className="pg-fixture-head">
        <span>{name}</span>
        <VersionChip label={label} dot={data.releases.length > 1} onClick={() => console.log(`chip: ${name}`)} />
      </div>
      <div className="pg-fixture-body">
        <ReleasesPanel data={data} />
      </div>
    </section>
  );
}

function App() {
  const [open, setOpen] = useState<Theme | null>(null);
  const narrow = useMediaQuery('(max-width: 640px)');
  return (
    <>
      <header className="pg-header">
        <h1>ui-kit playground</h1>
        {THEMES.map((t) => (
          <button key={t.id} type="button" onClick={() => setOpen(t.id)}>
            Open drawer: {t.id}
          </button>
        ))}
      </header>
      <main className="pg-themes">
        {THEMES.map((t) => (
          <div key={t.id} className={`pg-theme pg-theme-${t.id}`}>
            <h2>{t.label}</h2>
            {FIXTURES.map(([name, data]) => (
              <Fixture key={name} name={name} data={data} />
            ))}
            {/* Rendered inside the theme's wrapper, so the drawer inherits that theme's tokens as it would inside the app. */}
            {open === t.id && <ReleasesDrawer data={ALL_CONSTRUCTS} narrow={narrow} onClose={() => setOpen(null)} />}
          </div>
        ))}
      </main>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
