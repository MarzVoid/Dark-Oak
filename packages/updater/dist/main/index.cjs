var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main/index.ts
var index_exports = {};
__export(index_exports, {
  checkForUpdates: () => checkForUpdates,
  downloadUpdate: () => downloadUpdate,
  initUpdater: () => initUpdater,
  installUpdate: () => installUpdate
});
module.exports = __toCommonJS(index_exports);
var import_node_child_process = require("node:child_process");
var import_electron = require("electron");
var import_node_path2 = __toESM(require("node:path"), 1);
var import_node_fs2 = __toESM(require("node:fs"), 1);

// src/main/semver.ts
function cleanVersion(v) {
  return v.trim().replace(/^v/i, "");
}
function compareSemver(v1, v2) {
  const clean1 = cleanVersion(v1);
  const clean2 = cleanVersion(v2);
  const [main1, pre1] = clean1.split("-");
  const [main2, pre2] = clean2.split("-");
  const parts1 = main1.split(".").map((p) => parseInt(p, 10) || 0);
  const parts2 = main2.split(".").map((p) => parseInt(p, 10) || 0);
  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  if (pre1 && !pre2) return -1;
  if (!pre1 && pre2) return 1;
  if (pre1 && pre2) {
    return pre1.localeCompare(pre2);
  }
  return 0;
}
function isNewerVersion(remote, current) {
  return compareSemver(remote, current) > 0;
}

// src/main/github.ts
function pickAssetForPlatform(assets, platform = process.platform) {
  if (!assets || assets.length === 0) return null;
  if (platform === "win32") {
    const exe = assets.find((a) => a.name.toLowerCase().endsWith(".exe"));
    if (exe) return exe;
    const msi = assets.find((a) => a.name.toLowerCase().endsWith(".msi"));
    if (msi) return msi;
  }
  if (platform === "darwin") {
    const dmg = assets.find((a) => a.name.toLowerCase().endsWith(".dmg"));
    if (dmg) return dmg;
    const zip = assets.find((a) => a.name.toLowerCase().endsWith(".zip"));
    if (zip) return zip;
  }
  if (platform === "linux") {
    const appImage = assets.find((a) => a.name.toLowerCase().endsWith(".appimage"));
    if (appImage) return appImage;
    const deb = assets.find((a) => a.name.toLowerCase().endsWith(".deb"));
    if (deb) return deb;
  }
  return assets[0] || null;
}
async function fetchGitHubRelease(repo, token, platform = process.platform) {
  const cleanRepo = repo.replace(/^https:\/\/github\.com\//i, "").replace(/\.git$/i, "");
  const apiUrl = `https://api.github.com/repos/${cleanRepo}/releases/latest?ts=${Date.now()}`;
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "Electron-Auto-Updater"
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }
  const response = await fetch(apiUrl, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const version = (data.tag_name || data.name || "").trim().replace(/^v/i, "");
  const asset = pickAssetForPlatform(data.assets || [], platform);
  if (!asset) {
    throw new Error(`No compatible release asset found for platform ${platform}`);
  }
  return {
    info: {
      version,
      notes: data.body || "",
      url: data.html_url || "",
      releaseDate: data.published_at,
      assetName: asset.name
    },
    downloadUrl: asset.browser_download_url,
    assetName: asset.name
  };
}

// src/main/customFeed.ts
var import_node_path = __toESM(require("node:path"), 1);
async function fetchCustomFeed(feedUrl, platform = process.platform) {
  const urlWithCacheBust = feedUrl.includes("?") ? `${feedUrl}&ts=${Date.now()}` : `${feedUrl}?ts=${Date.now()}`;
  const response = await fetch(urlWithCacheBust, {
    headers: {
      "User-Agent": "Electron-Auto-Updater",
      "Accept": "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(`Custom server error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const version = (data.version || "").trim().replace(/^v/i, "");
  let downloadUrl = data.url || "";
  if (data.platforms) {
    const platformUrl = data.platforms[platform];
    if (platformUrl) {
      downloadUrl = platformUrl;
    }
  }
  if (!downloadUrl) {
    throw new Error(`No download url specified in custom feed for platform ${platform}`);
  }
  const assetName = import_node_path.default.basename(new URL(downloadUrl).pathname) || `update-${version}.exe`;
  return {
    info: {
      version,
      notes: data.notes || "",
      url: downloadUrl,
      assetName
    },
    downloadUrl,
    assetName
  };
}

// src/main/downloader.ts
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_stream = require("node:stream");
async function downloadFile(url, destPath, onProgress) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Electron-Auto-Updater",
      "Accept": "application/octet-stream, application/vnd.github+json, */*"
    },
    redirect: "follow"
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error("Response body is null");
  }
  const total = Number(response.headers.get("content-length") || 0);
  let loaded = 0;
  const fileStream = import_node_fs.default.createWriteStream(destPath);
  const readable = import_node_stream.Readable.fromWeb(response.body);
  readable.on("data", (chunk) => {
    loaded += chunk.length;
    if (onProgress) {
      onProgress(loaded, total);
    }
  });
  return new Promise((resolve, reject) => {
    readable.pipe(fileStream);
    fileStream.on("finish", () => resolve(destPath));
    fileStream.on("error", (err) => reject(err));
    readable.on("error", (err) => reject(err));
  });
}

// src/main/index.ts
var initialized = false;
var currentOptions = {};
var latestUpdateInfo = null;
var latestDownloadUrl = null;
var latestAssetName = null;
var downloadedFilePath = null;
var isDownloading = false;
var checkPromise = null;
function getCurrentVersion() {
  if (currentOptions.currentVersion) {
    return currentOptions.currentVersion;
  }
  const appVer = import_electron.app.getVersion();
  if (appVer && appVer !== process.versions.electron) {
    return appVer;
  }
  try {
    const pkg = JSON.parse(import_node_fs2.default.readFileSync(import_node_path2.default.join(process.cwd(), "package.json"), "utf8"));
    if (pkg.version) return pkg.version;
  } catch (e) {
  }
  return "1.0.0";
}
function emitEvent(event) {
  currentOptions.onEvent?.(event);
  const win = currentOptions.getMainWindow ? currentOptions.getMainWindow() : import_electron.BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) {
    win.webContents.send("updater:event", event);
  }
}
async function checkForUpdates() {
  if (checkPromise) {
    return checkPromise;
  }
  checkPromise = (async () => {
    try {
      emitEvent({ type: "checking" });
      const currentVersion = getCurrentVersion();
      let fetchResult = null;
      if (currentOptions.customFeedUrl) {
        fetchResult = await fetchCustomFeed(currentOptions.customFeedUrl, currentOptions.platform);
      } else if (currentOptions.repo) {
        fetchResult = await fetchGitHubRelease(currentOptions.repo, currentOptions.token, currentOptions.platform);
      } else {
        throw new Error("Neither repo nor customFeedUrl was provided in updater configuration");
      }
      if (!fetchResult) {
        emitEvent({ type: "none" });
        return { ok: true, hasUpdate: false, info: null };
      }
      latestUpdateInfo = fetchResult.info;
      latestDownloadUrl = fetchResult.downloadUrl;
      latestAssetName = fetchResult.assetName || `update-${latestUpdateInfo.version}.exe`;
      const hasUpdate = isNewerVersion(latestUpdateInfo.version, currentVersion);
      if (hasUpdate) {
        emitEvent({
          type: "available",
          info: latestUpdateInfo
        });
        currentOptions.onUpdateAvailable?.(latestUpdateInfo);
      } else {
        emitEvent({ type: "none" });
      }
      return {
        ok: true,
        hasUpdate,
        info: hasUpdate ? latestUpdateInfo : null
      };
    } catch (err) {
      const errorMsg = String(err?.message || err);
      emitEvent({ type: "error", error: errorMsg });
      return {
        ok: false,
        error: errorMsg
      };
    } finally {
      checkPromise = null;
    }
  })();
  return checkPromise;
}
async function downloadUpdate() {
  if (isDownloading) {
    return { ok: false, error: "Download already in progress" };
  }
  if (!latestDownloadUrl || !latestAssetName) {
    const checkRes = await checkForUpdates();
    if (!checkRes.ok || !checkRes.hasUpdate) {
      return { ok: false, error: "No update available to download" };
    }
  }
  if (!latestDownloadUrl || !latestAssetName) {
    return { ok: false, error: "No download url available" };
  }
  isDownloading = true;
  try {
    const tempDir = import_electron.app.getPath("temp");
    const destination = import_node_path2.default.join(tempDir, latestAssetName);
    await downloadFile(latestDownloadUrl, destination, (loaded, total) => {
      const percent = total > 0 ? loaded / total * 100 : 0;
      emitEvent({
        type: "progress",
        percent,
        loaded,
        total
      });
    });
    downloadedFilePath = destination;
    emitEvent({
      type: "downloaded",
      info: { path: destination }
    });
    return {
      ok: true,
      filePath: destination
    };
  } catch (err) {
    const errorMsg = String(err?.message || err);
    emitEvent({ type: "error", error: errorMsg });
    return {
      ok: false,
      error: errorMsg
    };
  } finally {
    isDownloading = false;
  }
}
async function installUpdate() {
  if (!downloadedFilePath) {
    return { ok: false, error: "No downloaded update found to install" };
  }
  try {
    emitEvent({ type: "installing" });
    if (process.platform === "win32") {
      const installerPath = downloadedFilePath;
      const localAppData = process.env.LOCALAPPDATA || "";
      const appName = currentOptions.appName || import_electron.app.getName() || "Dark Oak";
      const exeName = currentOptions.executableName || (appName.endsWith(".exe") ? appName : `${appName}.exe`);
      const targetInstalledExe = import_node_path2.default.join(localAppData, "Programs", appName, exeName);
      const targetByPackage = import_node_path2.default.join(localAppData, "Programs", "dark-oak", exeName);
      const fallbackExe = process.execPath;
      const safeVbsPrefix = appName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      const vbsPath = import_node_path2.default.join(import_electron.app.getPath("temp"), `${safeVbsPrefix}-updater.vbs`);
      const vbsScript = [
        'Set WshShell = CreateObject("WScript.Shell")',
        'Set fso = CreateObject("Scripting.FileSystemObject")',
        "WScript.Sleep 1000",
        "On Error Resume Next",
        `WshShell.Run "taskkill /F /IM ""${exeName}""", 0, True`,
        "WScript.Sleep 500",
        `WshShell.Run """${installerPath}"" /S", 0, True`,
        "WScript.Sleep 800",
        `If fso.FileExists("${targetInstalledExe}") Then`,
        `  WshShell.Run """${targetInstalledExe}""", 1, False`,
        `ElseIf fso.FileExists("${targetByPackage}") Then`,
        `  WshShell.Run """${targetByPackage}""", 1, False`,
        `ElseIf fso.FileExists("${fallbackExe}") Then`,
        `  WshShell.Run """${fallbackExe}""", 1, False`,
        "End If",
        "If fso.FileExists(WScript.ScriptFullName) Then",
        "  fso.DeleteFile WScript.ScriptFullName",
        "End If"
      ].join("\r\n");
      import_node_fs2.default.writeFileSync(vbsPath, vbsScript, "utf8");
      const child = (0, import_node_child_process.spawn)("wscript.exe", [vbsPath], {
        detached: true,
        stdio: "ignore"
      });
      child.unref();
      setTimeout(() => {
        import_electron.app.exit(0);
      }, 250);
      return { ok: true };
    }
    await import_electron.shell.openPath(downloadedFilePath);
    setTimeout(() => {
      import_electron.app.quit();
    }, 600);
    return { ok: true };
  } catch (err) {
    const errorMsg = String(err?.message || err);
    return { ok: false, error: errorMsg };
  }
}
function initUpdater(options = {}) {
  currentOptions = { ...options };
  if (initialized) {
    return;
  }
  initialized = true;
  import_electron.ipcMain.handle("updater:getVersion", () => {
    return getCurrentVersion();
  });
  import_electron.ipcMain.handle("updater:check", async () => {
    return await checkForUpdates();
  });
  import_electron.ipcMain.handle("updater:download", async () => {
    return await downloadUpdate();
  });
  import_electron.ipcMain.handle("updater:install", async () => {
    return await installUpdate();
  });
  if (options.autoCheckIntervalMs && options.autoCheckIntervalMs > 0) {
    setInterval(() => {
      checkForUpdates().catch(() => {
      });
    }, options.autoCheckIntervalMs);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkForUpdates,
  downloadUpdate,
  initUpdater,
  installUpdate
});
