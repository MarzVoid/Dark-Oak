// src/preload/index.ts
import { contextBridge, ipcRenderer } from "electron";
function createUpdaterBridge(customIpcRenderer = ipcRenderer) {
  const ipc = customIpcRenderer;
  return {
    check: () => ipc.invoke("updater:check"),
    download: () => ipc.invoke("updater:download"),
    install: () => ipc.invoke("updater:install"),
    getVersion: () => ipc.invoke("updater:getVersion"),
    onEvent: (callback) => {
      const handler = (_event, payload) => {
        callback(payload);
      };
      ipc.on("updater:event", handler);
      return () => {
        ipc.removeListener("updater:event", handler);
      };
    }
  };
}
var updaterBridge = {
  check: () => typeof ipcRenderer !== "undefined" ? ipcRenderer.invoke("updater:check") : Promise.resolve({ ok: false, error: "ipcRenderer undefined" }),
  download: () => typeof ipcRenderer !== "undefined" ? ipcRenderer.invoke("updater:download") : Promise.resolve({ ok: false, error: "ipcRenderer undefined" }),
  install: () => typeof ipcRenderer !== "undefined" ? ipcRenderer.invoke("updater:install") : Promise.resolve({ ok: false, error: "ipcRenderer undefined" }),
  getVersion: () => typeof ipcRenderer !== "undefined" ? ipcRenderer.invoke("updater:getVersion") : Promise.resolve("1.0.0"),
  onEvent: (callback) => {
    if (typeof ipcRenderer === "undefined") return () => {
    };
    const handler = (_event, payload) => {
      callback(payload);
    };
    ipcRenderer.on("updater:event", handler);
    return () => {
      ipcRenderer.removeListener("updater:event", handler);
    };
  }
};
function exposeUpdater(apiKey = "updater", customContextBridge = contextBridge, customIpcRenderer) {
  const bridge = customIpcRenderer ? createUpdaterBridge(customIpcRenderer) : updaterBridge;
  const cb = customContextBridge || contextBridge;
  try {
    cb.exposeInMainWorld(apiKey, bridge);
  } catch {
    if (typeof window !== "undefined") {
      window[apiKey] = bridge;
    } else if (typeof globalThis !== "undefined") {
      globalThis[apiKey] = bridge;
    }
  }
}
export {
  createUpdaterBridge,
  exposeUpdater,
  updaterBridge
};
