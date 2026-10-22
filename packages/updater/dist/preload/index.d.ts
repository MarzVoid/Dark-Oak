import { IUpdaterBridge } from '../types';
export declare function createUpdaterBridge(customIpcRenderer?: any): IUpdaterBridge;
export declare const updaterBridge: IUpdaterBridge;
export declare function exposeUpdater(apiKey?: string, customContextBridge?: any, customIpcRenderer?: any): void;
