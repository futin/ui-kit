// The version chip (spec Part 2 §Public surface): a button the host places, labelled the way guide-manager's rail chip is. Placement is the host's — it
// passes `className` and wraps `onClick`, as guide-manager does to close its phone menu.

export type VersionChipProps = {
  /** `chipLabel(current)`, e.g. `v0.3.0` or `v0.3.0+2`. */
  label: string;
  /** An unseen release exists: adds `uk-chip-dot` and says so in the aria-label. */
  dot: boolean;
  onClick(): void;
  /** Appended after `uk-chip`. */
  className?: string;
};

export function VersionChip({ label, dot, onClick, className }: VersionChipProps) {
  return (
    <button
      type="button"
      className={className ? `uk-chip ${className}` : 'uk-chip'}
      aria-label={dot ? `What's new — ${label}, new release` : `What's new — ${label}`}
      onClick={onClick}
    >
      <span className="uk-chip-label">{label}</span>
      {dot && <span className="uk-chip-dot" aria-hidden="true" />}
    </button>
  );
}
