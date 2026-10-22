import { UpdateCheckResult, UpdateDownloadResult, UpdateInstallResult, UpdaterOptions } from '../types';
export declare function checkForUpdates(): Promise<UpdateCheckResult>;
export declare function downloadUpdate(): Promise<UpdateDownloadResult>;
export declare function installUpdate(): Promise<UpdateInstallResult>;
export declare function initUpdater(options?: UpdaterOptions): void;
