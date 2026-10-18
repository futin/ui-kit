// `Drawer` + `ReleasesPanel` (spec Part 2 §Public surface): the host's dismiss and focus props go straight through to the drawer (D15), `renderNotes` to the
// panel (D14).
import type { DrawerProps } from '../ui/Drawer.js';
import { Drawer } from '../ui/Drawer.js';
import type { ReleasesPanelProps } from './ReleasesPanel.js';
import { ReleasesPanel } from './ReleasesPanel.js';

export type ReleasesDrawerProps = ReleasesPanelProps & Pick<DrawerProps, 'onClose' | 'closeOnEscape' | 'narrow' | 'restoreFocus'>;

export function ReleasesDrawer({ data, renderNotes, onClose, closeOnEscape, narrow, restoreFocus }: ReleasesDrawerProps) {
  return (
    <Drawer label="What's new" onClose={onClose} closeOnEscape={closeOnEscape} narrow={narrow} restoreFocus={restoreFocus}>
      <ReleasesPanel data={data} renderNotes={renderNotes} />
    </Drawer>
  );
}
