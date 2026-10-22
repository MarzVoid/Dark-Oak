var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/preload/index.ts
var index_exports = {};
__export(index_exports, {
  createUpdaterBridge: () => createUpdaterBridge,
  exposeUpdater: () => exposeUpdater,
  updaterBridge: () => updaterBridge
});
module.exports = __toCommonJS(index_exports);
var import_electron = require("electron");
function createUpdaterBridge(customIpcRenderer = import_electron.ipcRenderer) {
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
  check: () => typeof import_electron.ipcRenderer !== "undefined" ? import_electron.ipcRenderer.invoke("updater:check") : Promise.resolve({ ok: false, error: "ipcRenderer undefined" }),
  download: () => typeof import_electron.ipcRenderer !== "undefined" ? import_electron.ipcRenderer.invoke("updater:download") : Promise.resolve({ ok: false, error: "ipcRenderer undefined" }),
  install: () => typeof import_electron.ipcRenderer !== "undefined" ? import_electron.ipcRenderer.invoke("updater:install") : Promise.resolve({ ok: false, error: "ipcRenderer undefined" }),
  getVersion: () => typeof import_electron.ipcRenderer !== "undefined" ? import_electron.ipcRenderer.invoke("updater:getVersion") : Promise.resolve("1.0.0"),
  onEvent: (callback) => {
    if (typeof import_electron.ipcRenderer === "undefined") return () => {
    };
    const handler = (_event, payload) => {
      callback(payload);
    };
    import_electron.ipcRenderer.on("updater:event", handler);
    return () => {
      import_electron.ipcRenderer.removeListener("updater:event", handler);
    };
  }
};
function exposeUpdater(apiKey = "updater", customContextBridge = import_electron.contextBridge, customIpcRenderer) {
  const bridge = customIpcRenderer ? createUpdaterBridge(customIpcRenderer) : updaterBridge;
  const cb = customContextBridge || import_electron.contextBridge;
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createUpdaterBridge,
  exposeUpdater,
  updaterBridge
});
