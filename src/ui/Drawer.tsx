// The drawer shell (spec D15). It accepts the host's dismiss and focus layer instead of owning one: a host with its own Escape stack passes
// closeOnEscape={false} and handles the key itself, and a host whose opener can disappear picks the focus target through restoreFocus.
import { useEffect, useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';

export type DrawerProps = {
  label: string;
  onClose(): void;
  children: ReactNode;
  /** Default true: the drawer adds one keydown listener on document and closes on Escape. False: no key handling at all. */
  closeOnEscape?: boolean;
  /** Adds `uk-drawer--narrow`; the shipped CSS has no media queries, so the host decides when the phone shape applies. */
  narrow?: boolean;
  /**
   * Where focus goes on close. Default: the element focused before opening, if it is still connected. A function picks the target from that element;
   * false moves nothing.
   */
  restoreFocus?: false | ((prev: Element | null) => HTMLElement | null);
};

export function Drawer({ label, onClose, children, closeOnEscape = true, narrow = false, restoreFocus }: DrawerProps) {
  const panel = useRef<HTMLElement>(null);
  // Latest props for the effects below, so a host passing a fresh onClose or restoreFocus each render neither re-attaches the listener nor re-runs focus.
  const latest = useRef({ onClose, restoreFocus });
  latest.current = { onClose, restoreFocus };

  useEffect(() => {
    if (!closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') latest.current.onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeOnEscape]);

  useEffect(() => {
    const prev = document.activeElement;
    panel.current?.focus();
    return () => {
      const restore = latest.current.restoreFocus;
      if (restore === false) return;
      const target = restore ? restore(prev) : prev?.isConnected ? (prev as HTMLElement) : null;
      target?.focus?.();
    };
  }, []);

  const onScrim = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="uk-drawer-scrim" onClick={onScrim}>
      <aside ref={panel} className={narrow ? 'uk-drawer uk-drawer--narrow' : 'uk-drawer'} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <button type="button" className="uk-drawer-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        {children}
      </aside>
    </div>
  );
}
