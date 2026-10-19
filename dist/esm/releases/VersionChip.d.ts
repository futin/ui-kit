export type VersionChipProps = {
    /** `chipLabel(current)`, e.g. `v0.3.0` or `v0.3.0+2`. */
    label: string;
    /** An unseen release exists: adds `uk-chip-dot` and says so in the aria-label. */
    dot: boolean;
    onClick(): void;
    /** The phone shape: adds `uk-chip--narrow`, a transparent 44x44 minimum hit area around the same 28px pill. Derive it from the host's own breakpoint. */
    narrow?: boolean;
};
export declare function VersionChip({ label, dot, onClick, narrow }: VersionChipProps): import("react").JSX.Element;
