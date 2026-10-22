import path from 'node:path';
import { CustomFeedResponse, UpdateInfo } from '../types';

export async function fetchCustomFeed(
  feedUrl: string,
  platform: NodeJS.Platform = process.platform
): Promise<{ info: UpdateInfo; downloadUrl: string; assetName: string }> {
  const urlWithCacheBust = feedUrl.includes('?')
    ? `${feedUrl}&ts=${Date.now()}`
    : `${feedUrl}?ts=${Date.now()}`;

  const response = await fetch(urlWithCacheBust, {
    headers: {
      'User-Agent': 'Electron-Auto-Updater',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Custom server error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as CustomFeedResponse;
  const version = (data.version || '').trim().replace(/^v/i, '');

  let downloadUrl = data.url || '';
  if (data.platforms) {
    const platformUrl = data.platforms[platform as keyof typeof data.platforms];
    if (platformUrl) {
      downloadUrl = platformUrl;
    }
  }

  if (!downloadUrl) {
    throw new Error(`No download url specified in custom feed for platform ${platform}`);
  }

  const assetName = path.basename(new URL(downloadUrl).pathname) || `update-${version}.exe`;

  return {
    info: {
      version,
      notes: data.notes || '',
      url: downloadUrl,
      assetName
    },
    downloadUrl,
    assetName
  };
}
