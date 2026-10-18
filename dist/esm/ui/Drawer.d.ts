import type { ReactNode } from 'react';
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
export declare function Drawer({ label, onClose, children, closeOnEscape, narrow, restoreFocus }: DrawerProps): import("react").JSX.Element;
