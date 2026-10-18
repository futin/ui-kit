import './dom.js';
import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import type { ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
import { Drawer } from '../src/ui/Drawer.js';

type Props = Omit<ComponentProps<typeof Drawer>, 'children' | 'onClose' | 'label'> & { label?: string };

// Mounts a Drawer into a container attached to document.body (focus only works on connected elements) with one child button, `inside`.
function mount(props: Props = {}) {
  const onClose = mock.fn();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() =>
    root.render(
      <Drawer label="Panel" onClose={onClose} {...props}>
        <button className="inside">inside</button>
      </Drawer>,
    ),
  );
  const q = <T extends Element>(sel: string): T => {
    const el = host.querySelector<T>(sel);
    assert.ok(el, `${sel} is not rendered`);
    return el;
  };
  return {
    onClose,
    host,
    q,
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

/** A focused button outside the drawer, standing in for the element that opened it. */
function opener(): HTMLButtonElement {
  const b = document.createElement('button');
  b.textContent = 'open';
  document.body.append(b);
  b.focus();
  assert.equal(document.activeElement, b);
  return b;
}

const escape = () => act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));

afterEach(() => {
  mock.restoreAll();
  document.body.replaceChildren();
});

describe('Drawer', () => {
  it('renders the scrim, the labelled modal panel, the close button and the children', () => {
    const d = mount({ label: "What's new" });
    const scrim = d.q('div.uk-drawer-scrim');
    const panel = d.q('aside.uk-drawer');
    assert.equal(panel.parentElement, scrim);
    assert.equal(panel.getAttribute('role'), 'dialog');
    assert.equal(panel.getAttribute('aria-modal'), 'true');
    assert.equal(panel.getAttribute('aria-label'), "What's new");
    assert.equal(panel.getAttribute('tabindex'), '-1');
    assert.equal(panel.classList.contains('uk-drawer--narrow'), false);
    const close = d.q('button.uk-drawer-close');
    assert.equal(close.parentElement, panel);
    assert.equal(close.getAttribute('aria-label'), 'Close');
    assert.equal(d.q('button.inside').parentElement, panel);
    d.unmount();
  });

  it('calls onClose once on Escape on document', () => {
    const d = mount();
    escape();
    assert.equal(d.onClose.mock.callCount(), 1);
    act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    assert.equal(d.onClose.mock.callCount(), 1);
    d.unmount();
    escape();
    assert.equal(d.onClose.mock.callCount(), 1, 'the listener is removed on unmount');
  });

  it('with closeOnEscape={false} ignores Escape and attaches no keydown listener to document', () => {
    const add = mock.method(document, 'addEventListener');
    const d = mount({ closeOnEscape: false });
    escape();
    assert.equal(d.onClose.mock.callCount(), 0);
    assert.deepEqual(add.mock.calls.filter((c) => c.arguments[0] === 'keydown'), []);
    d.unmount();
  });

  it('closes on the ✕ and on a scrim click, but not on a click inside the panel', () => {
    const d = mount();
    act(() => d.q<HTMLElement>('button.inside').click());
    act(() => d.q<HTMLElement>('aside.uk-drawer').click());
    assert.equal(d.onClose.mock.callCount(), 0);
    act(() => d.q<HTMLElement>('button.uk-drawer-close').click());
    assert.equal(d.onClose.mock.callCount(), 1);
    act(() => d.q<HTMLElement>('div.uk-drawer-scrim').click());
    assert.equal(d.onClose.mock.callCount(), 2);
    d.unmount();
  });

  it('focuses the panel on mount', () => {
    opener();
    const d = mount();
    assert.equal(document.activeElement, d.q('aside.uk-drawer'));
    d.unmount();
  });

  it('returns focus on unmount to the element focused before mount', () => {
    const b = opener();
    const d = mount();
    d.unmount();
    assert.equal(document.activeElement, b);
  });

  it('does not move focus to an opener removed while it was open', () => {
    const b = opener();
    const focus = mock.method(b, 'focus');
    const d = mount();
    b.remove();
    d.unmount();
    assert.equal(focus.mock.callCount(), 0);
  });

  it('with a restoreFocus function focuses the element it returns, given the previous element', () => {
    const b = opener();
    const target = document.createElement('button');
    document.body.append(target);
    const pick = mock.fn((_prev: Element | null) => target);
    const d = mount({ restoreFocus: pick });
    d.unmount();
    assert.equal(document.activeElement, target);
    assert.equal(pick.mock.callCount(), 1);
    assert.equal(pick.mock.calls[0].arguments[0], b);
  });

  it('with restoreFocus={false} leaves focus where it is on unmount', () => {
    const b = opener();
    const d = mount({ restoreFocus: false });
    const elsewhere = document.createElement('button');
    document.body.append(elsewhere);
    elsewhere.focus();
    d.unmount();
    assert.equal(document.activeElement, elsewhere);
    assert.notEqual(document.activeElement, b);
  });

  it('adds uk-drawer--narrow with narrow', () => {
    const d = mount({ narrow: true });
    assert.equal(d.q('aside.uk-drawer').classList.contains('uk-drawer--narrow'), true);
    d.unmount();
  });
});
