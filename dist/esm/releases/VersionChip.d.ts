export type VersionChipProps = {
    /** `chipLabel(current)`, e.g. `v0.3.0` or `v0.3.0+2`. */
    label: string;
    /** An unseen release exists: adds `uk-chip-dot` and says so in the aria-label. */
    dot: boolean;
    onClick(): void;
    /** Appended after `uk-chip`. */
    className?: string;
};
export declare function VersionChip({ label, dot, onClick, className }: VersionChipProps): import("react").JSX.Element;
