import { contextBridge, ipcRenderer } from 'electron';
import { IUpdaterBridge, UpdateEvent } from '../types';

export function createUpdaterBridge(customIpcRenderer: any = ipcRenderer): IUpdaterBridge {
  const ipc = customIpcRenderer;
  return {
    check: () => ipc.invoke('updater:check'),
    download: () => ipc.invoke('updater:download'),
    install: () => ipc.invoke('updater:install'),
    getVersion: () => ipc.invoke('updater:getVersion'),
    onEvent: (callback: (event: UpdateEvent) => void) => {
      const handler = (_event: any, payload: UpdateEvent) => {
        callback(payload);
      };
      ipc.on('updater:event', handler);
      return () => {
        ipc.removeListener('updater:event', handler);
      };
    }
  };
}

export const updaterBridge: IUpdaterBridge = {
  check: () => (typeof ipcRenderer !== 'undefined' ? ipcRenderer.invoke('updater:check') : Promise.resolve({ ok: false, error: 'ipcRenderer undefined' })),
  download: () => (typeof ipcRenderer !== 'undefined' ? ipcRenderer.invoke('updater:download') : Promise.resolve({ ok: false, error: 'ipcRenderer undefined' })),
  install: () => (typeof ipcRenderer !== 'undefined' ? ipcRenderer.invoke('updater:install') : Promise.resolve({ ok: false, error: 'ipcRenderer undefined' })),
  getVersion: () => (typeof ipcRenderer !== 'undefined' ? ipcRenderer.invoke('updater:getVersion') : Promise.resolve('1.0.0')),
  onEvent: (callback: (event: UpdateEvent) => void) => {
    if (typeof ipcRenderer === 'undefined') return () => {};
    const handler = (_event: any, payload: UpdateEvent) => {
      callback(payload);
    };
    ipcRenderer.on('updater:event', handler);
    return () => {
      ipcRenderer.removeListener('updater:event', handler);
    };
  }
};

export function exposeUpdater(apiKey: string = 'updater', customContextBridge: any = contextBridge, customIpcRenderer?: any) {
  const bridge = customIpcRenderer ? createUpdaterBridge(customIpcRenderer) : updaterBridge;
  const cb = customContextBridge || contextBridge;
  try {
    cb.exposeInMainWorld(apiKey, bridge);
  } catch {
    if (typeof window !== 'undefined') {
      (window as any)[apiKey] = bridge;
    } else if (typeof globalThis !== 'undefined') {
      (globalThis as any)[apiKey] = bridge;
    }
  }
}
