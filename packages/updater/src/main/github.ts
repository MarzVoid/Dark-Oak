import { UpdateInfo } from '../types';

export interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GitHubReleaseResponse {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at?: string;
  assets: GitHubReleaseAsset[];
}

export function pickAssetForPlatform(
  assets: GitHubReleaseAsset[],
  platform: NodeJS.Platform = process.platform
): GitHubReleaseAsset | null {
  if (!assets || assets.length === 0) return null;

  if (platform === 'win32') {
    const exe = assets.find(a => a.name.toLowerCase().endsWith('.exe'));
    if (exe) return exe;
    const msi = assets.find(a => a.name.toLowerCase().endsWith('.msi'));
    if (msi) return msi;
  }

  if (platform === 'darwin') {
    const dmg = assets.find(a => a.name.toLowerCase().endsWith('.dmg'));
    if (dmg) return dmg;
    const zip = assets.find(a => a.name.toLowerCase().endsWith('.zip'));
    if (zip) return zip;
  }

  if (platform === 'linux') {
    const appImage = assets.find(a => a.name.toLowerCase().endsWith('.appimage'));
    if (appImage) return appImage;
    const deb = assets.find(a => a.name.toLowerCase().endsWith('.deb'));
    if (deb) return deb;
  }

  return assets[0] || null;
}

export async function fetchGitHubRelease(
  repo: string,
  token?: string,
  platform: NodeJS.Platform = process.platform
): Promise<{ info: UpdateInfo; downloadUrl: string; assetName: string }> {
  const cleanRepo = repo.replace(/^https:\/\/github\.com\//i, '').replace(/\.git$/i, '');
  const apiUrl = `https://api.github.com/repos/${cleanRepo}/releases/latest?ts=${Date.now()}`;

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'Electron-Auto-Updater'
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(apiUrl, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as GitHubReleaseResponse;
  const version = (data.tag_name || data.name || '').trim().replace(/^v/i, '');
  const asset = pickAssetForPlatform(data.assets || [], platform);

  if (!asset) {
    throw new Error(`No compatible release asset found for platform ${platform}`);
  }

  return {
    info: {
      version,
      notes: data.body || '',
      url: data.html_url || '',
      releaseDate: data.published_at,
      assetName: asset.name
    },
    downloadUrl: asset.browser_download_url,
    assetName: asset.name
  };
}
