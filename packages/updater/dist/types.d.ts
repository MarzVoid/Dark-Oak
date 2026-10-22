export interface UpdateInfo {
    version: string;
    notes: string;
    url: string;
    releaseDate?: string;
    assetName?: string;
    downloadUrl?: string;
}
export interface UpdateCheckResult {
    ok: boolean;
    hasUpdate?: boolean;
    info?: UpdateInfo | null;
    error?: string;
}
export interface UpdateDownloadResult {
    ok: boolean;
    filePath?: string;
    error?: string;
}
export interface UpdateInstallResult {
    ok: boolean;
    error?: string;
}
export type UpdateEventType = 'checking' | 'available' | 'none' | 'progress' | 'downloaded' | 'installing' | 'error';
export interface UpdateEvent {
    type: UpdateEventType;
    percent?: number;
    loaded?: number;
    total?: number;
    info?: UpdateInfo | {
        path: string;
    };
    error?: string;
}
export interface CustomFeedResponse {
    version: string;
    notes?: string;
    url?: string;
    platforms?: {
        win32?: string;
        darwin?: string;
        linux?: string;
    };
}
export interface UpdaterOptions {
    repo?: string;
    customFeedUrl?: string;
    token?: string;
    autoCheckIntervalMs?: number;
    getMainWindow?: () => any;
    platform?: NodeJS.Platform;
    currentVersion?: string;
    appName?: string;
    executableName?: string;
    onUpdateAvailable?: (info: UpdateInfo) => void;
    onEvent?: (event: UpdateEvent) => void;
}
export interface IUpdaterBridge {
    check: () => Promise<UpdateCheckResult>;
    download: () => Promise<UpdateDownloadResult>;
    install: () => Promise<UpdateInstallResult>;
    getVersion: () => Promise<string>;
    onEvent: (callback: (event: UpdateEvent) => void) => () => void;
}
declare global {
    interface Window {
        updater?: IUpdaterBridge;
    }
}
