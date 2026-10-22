export type UpdaterStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'installing' | 'up-to-date' | 'error';
export interface UseUpdaterReturn {
    currentVersion: string;
    targetVersion: string | null;
    status: UpdaterStatus;
    percent: number;
    bytesLoaded: number;
    bytesTotal: number;
    notes: string;
    releaseUrl: string;
    error: string | null;
    isAvailable: boolean;
    isDownloading: boolean;
    isDownloaded: boolean;
    check: () => Promise<void>;
    download: () => Promise<void>;
    install: () => Promise<void>;
}
export declare function useUpdater(bridgeKey?: string): UseUpdaterReturn;
