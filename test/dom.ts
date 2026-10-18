// A jsdom global for the React tests, plus a hook harness over react-dom's act(). Import it before React so react-dom meets a document from the start; it is
// not a test file itself (the runner only picks up *.test.ts and *.test.tsx).
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
const g = globalThis as Record<string, unknown>;
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'Event', 'KeyboardEvent', 'MouseEvent']) {
  Object.defineProperty(globalThis, k, { value: (dom.window as unknown as Record<string, unknown>)[k], configurable: true, writable: true });
}
g.IS_REACT_ACT_ENVIRONMENT = true;

export type Rendered<T> = { result: { current: T }; rerender(): void; unmount(): void };

/** Mounts a component that calls `hook` on every render and exposes its latest return value, the way @testing-library's renderHook does. */
export function renderHook<T>(hook: () => T): Rendered<T> {
  const result = { current: undefined as T };
  const Probe = (): null => {
    result.current = hook();
    return null;
  };
  const root = createRoot(document.createElement('div'));
  act(() => root.render(createElement(Probe)));
  return {
    result,
    rerender: () => act(() => root.render(createElement(Probe))),
    unmount: () => act(() => root.unmount()),
  };
}

/** Lets pending promise chains (a stubbed fetch, then its .json(), then the state update) settle inside act(). */
export async function flush(): Promise<void> {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}
