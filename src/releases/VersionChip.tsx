// The version chip (spec Part 2 §Public surface): a button the host places, labelled the way guide-manager's rail chip is. Placement is the host's — it
// wraps the chip and `onClick`, as guide-manager does to close its phone menu — but the look is not: there is no `className`, so the pill is the same in every
// app. The one shape a host chooses is `narrow`, because only the host knows its phone breakpoint.

export type VersionChipProps = {
  /** `chipLabel(current)`, e.g. `v0.3.0` or `v0.3.0+2`. */
  label: string;
  /** An unseen release exists: adds `uk-chip-dot` and says so in the aria-label. */
  dot: boolean;
  onClick(): void;
  /** The phone shape: adds `uk-chip--narrow`, a transparent 44x44 minimum hit area around the same 28px pill. Derive it from the host's own breakpoint. */
  narrow?: boolean;
};

export function VersionChip({ label, dot, onClick, narrow }: VersionChipProps) {
  return (
    <button
      type="button"
      className={narrow ? 'uk-chip uk-chip--narrow' : 'uk-chip'}
      aria-label={dot ? `What's new — ${label}, new release` : `What's new — ${label}`}
      onClick={onClick}
    >
      <span className="uk-chip-label">{label}</span>
      {dot && <span className="uk-chip-dot" aria-hidden="true" />}
    </button>
  );
}
