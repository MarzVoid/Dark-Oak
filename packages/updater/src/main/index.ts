import { spawn } from 'node:child_process';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import {
  UpdateCheckResult,
  UpdateDownloadResult,
  UpdateEvent,
  UpdateInfo,
  UpdateInstallResult,
  UpdaterOptions
} from '../types';
import { isNewerVersion } from './semver';
import { fetchGitHubRelease } from './github';
import { fetchCustomFeed } from './customFeed';
import { downloadFile } from './downloader';

let initialized = false;
let currentOptions: UpdaterOptions = {};
let latestUpdateInfo: UpdateInfo | null = null;
let latestDownloadUrl: string | null = null;
let latestAssetName: string | null = null;
let downloadedFilePath: string | null = null;
let isDownloading = false;
let checkPromise: Promise<UpdateCheckResult> | null = null;

function getCurrentVersion(): string {
  if (currentOptions.currentVersion) {
    return currentOptions.currentVersion;
  }
  const appVer = app.getVersion();
  if (appVer && appVer !== process.versions.electron) {
    return appVer;
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    if (pkg.version) return pkg.version;
  } catch (e) {}
  return '1.0.0';
}

function emitEvent(event: UpdateEvent) {
  currentOptions.onEvent?.(event);
  const win = currentOptions.getMainWindow ? currentOptions.getMainWindow() : BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) {
    win.webContents.send('updater:event', event);
  }
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  if (checkPromise) {
    return checkPromise;
  }

  checkPromise = (async () => {
    try {
      emitEvent({ type: 'checking' });
      const currentVersion = getCurrentVersion();

      let fetchResult: { info: UpdateInfo; downloadUrl: string; assetName: string } | null = null;

      if (currentOptions.customFeedUrl) {
        fetchResult = await fetchCustomFeed(currentOptions.customFeedUrl, currentOptions.platform);
      } else if (currentOptions.repo) {
        fetchResult = await fetchGitHubRelease(currentOptions.repo, currentOptions.token, currentOptions.platform);
      } else {
        throw new Error('Neither repo nor customFeedUrl was provided in updater configuration');
      }

      if (!fetchResult) {
        emitEvent({ type: 'none' });
        return { ok: true, hasUpdate: false, info: null };
      }

      latestUpdateInfo = fetchResult.info;
      latestDownloadUrl = fetchResult.downloadUrl;
      latestAssetName = fetchResult.assetName || `update-${latestUpdateInfo.version}.exe`;

      const hasUpdate = isNewerVersion(latestUpdateInfo.version, currentVersion);

      if (hasUpdate) {
        emitEvent({
          type: 'available',
          info: latestUpdateInfo
        });
        currentOptions.onUpdateAvailable?.(latestUpdateInfo);
      } else {
        emitEvent({ type: 'none' });
      }

      return {
        ok: true,
        hasUpdate,
        info: hasUpdate ? latestUpdateInfo : null
      };
    } catch (err: any) {
      const errorMsg = String(err?.message || err);
      emitEvent({ type: 'error', error: errorMsg });
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

export async function downloadUpdate(): Promise<UpdateDownloadResult> {
  if (isDownloading) {
    return { ok: false, error: 'Download already in progress' };
  }

  if (!latestDownloadUrl || !latestAssetName) {
    const checkRes = await checkForUpdates();
    if (!checkRes.ok || !checkRes.hasUpdate) {
      return { ok: false, error: 'No update available to download' };
    }
  }

  if (!latestDownloadUrl || !latestAssetName) {
    return { ok: false, error: 'No download url available' };
  }

  isDownloading = true;

  try {
    const tempDir = app.getPath('temp');
    const destination = path.join(tempDir, latestAssetName);

    await downloadFile(latestDownloadUrl, destination, (loaded, total) => {
      const percent = total > 0 ? (loaded / total) * 100 : 0;
      emitEvent({
        type: 'progress',
        percent,
        loaded,
        total
      });
    });

    downloadedFilePath = destination;
    emitEvent({
      type: 'downloaded',
      info: { path: destination }
    });

    return {
      ok: true,
      filePath: destination
    };
  } catch (err: any) {
    const errorMsg = String(err?.message || err);
    emitEvent({ type: 'error', error: errorMsg });
    return {
      ok: false,
      error: errorMsg
    };
  } finally {
    isDownloading = false;
  }
}

export async function installUpdate(): Promise<UpdateInstallResult> {
  if (!downloadedFilePath) {
    return { ok: false, error: 'No downloaded update found to install' };
  }

  try {
    emitEvent({ type: 'installing' });

    if (process.platform === 'win32') {
      const installerPath = downloadedFilePath;
      const localAppData = process.env.LOCALAPPDATA || '';
      const appName = currentOptions.appName || app.getName() || 'Dark Oak';
      const exeName = currentOptions.executableName || (appName.endsWith('.exe') ? appName : `${appName}.exe`);
      const targetInstalledExe = path.join(localAppData, 'Programs', appName, exeName);
      const targetByPackage = path.join(localAppData, 'Programs', 'dark-oak', exeName);
      const fallbackExe = process.execPath;

      const safeVbsPrefix = appName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const vbsPath = path.join(app.getPath('temp'), `${safeVbsPrefix}-updater.vbs`);
      const vbsScript = [
        'Set WshShell = CreateObject("WScript.Shell")',
        'Set fso = CreateObject("Scripting.FileSystemObject")',
        'WScript.Sleep 1000',
        'On Error Resume Next',
        `WshShell.Run "taskkill /F /IM ""${exeName}""", 0, True`,
        'WScript.Sleep 500',
        `WshShell.Run """${installerPath}"" /S", 0, True`,
        'WScript.Sleep 800',
        `If fso.FileExists("${targetInstalledExe}") Then`,
        `  WshShell.Run """${targetInstalledExe}""", 1, False`,
        `ElseIf fso.FileExists("${targetByPackage}") Then`,
        `  WshShell.Run """${targetByPackage}""", 1, False`,
        `ElseIf fso.FileExists("${fallbackExe}") Then`,
        `  WshShell.Run """${fallbackExe}""", 1, False`,
        'End If',
        'If fso.FileExists(WScript.ScriptFullName) Then',
        '  fso.DeleteFile WScript.ScriptFullName',
        'End If'
      ].join('\r\n');

      fs.writeFileSync(vbsPath, vbsScript, 'utf8');

      const child = spawn('wscript.exe', [vbsPath], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      setTimeout(() => {
        app.exit(0);
      }, 250);

      return { ok: true };
    }

    await shell.openPath(downloadedFilePath);
    setTimeout(() => {
      app.quit();
    }, 600);
    return { ok: true };
  } catch (err: any) {
    const errorMsg = String(err?.message || err);
    return { ok: false, error: errorMsg };
  }
}

export function initUpdater(options: UpdaterOptions = {}) {
  currentOptions = { ...options };

  if (initialized) {
    return;
  }
  initialized = true;

  ipcMain.handle('updater:getVersion', () => {
    return getCurrentVersion();
  });

  ipcMain.handle('updater:check', async () => {
    return await checkForUpdates();
  });

  ipcMain.handle('updater:download', async () => {
    return await downloadUpdate();
  });

  ipcMain.handle('updater:install', async () => {
    return await installUpdate();
  });

  if (options.autoCheckIntervalMs && options.autoCheckIntervalMs > 0) {
    setInterval(() => {
      checkForUpdates().catch(() => {});
    }, options.autoCheckIntervalMs);
  }
}
