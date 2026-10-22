import fs from 'node:fs';
import { Readable } from 'node:stream';

export async function downloadFile(
  url: string,
  destPath: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Electron-Auto-Updater',
      'Accept': 'application/octet-stream, application/vnd.github+json, */*'
    },
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const total = Number(response.headers.get('content-length') || 0);
  let loaded = 0;

  const fileStream = fs.createWriteStream(destPath);
  const readable = Readable.fromWeb(response.body as any);

  readable.on('data', (chunk: Buffer) => {
    loaded += chunk.length;
    if (onProgress) {
      onProgress(loaded, total);
    }
  });

  return new Promise((resolve, reject) => {
    readable.pipe(fileStream);
    fileStream.on('finish', () => resolve(destPath));
    fileStream.on('error', (err) => reject(err));
    readable.on('error', (err) => reject(err));
  });
}
