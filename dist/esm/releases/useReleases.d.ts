import type { ReleasesResponse } from '../types.js';
export declare function useReleases(url?: string): {
    data: ReleasesResponse | null;
    refresh: () => void;
};
