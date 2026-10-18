import type { ReleasesResponse } from '../types.js';
export declare function useWhatsNew(o: {
    storageKey: string;
    url?: string;
}): {
    data: ReleasesResponse | null;
    chip: {
        label: string;
        dot: boolean;
    } | null;
    open: boolean;
    show: () => void;
    close: () => void;
};
