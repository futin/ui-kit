import type { DrawerProps } from '../ui/Drawer.js';
import type { ReleasesPanelProps } from './ReleasesPanel.js';
export type ReleasesDrawerProps = ReleasesPanelProps & Pick<DrawerProps, 'onClose' | 'closeOnEscape' | 'narrow' | 'restoreFocus'>;
export declare function ReleasesDrawer({ data, sanitize, onClose, closeOnEscape, narrow, restoreFocus }: ReleasesDrawerProps): import("react").JSX.Element;
