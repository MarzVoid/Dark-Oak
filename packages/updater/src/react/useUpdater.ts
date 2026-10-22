import { useState, useEffect, useCallback, useRef } from 'react';
import { IUpdaterBridge, UpdateEvent, UpdateInfo } from '../types';

export type UpdaterStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'installing'
  | 'up-to-date'
  | 'error';

export interface UseUpdaterReturn {
  currentVersion: string;
  targetVersion: string | null;
  status: UpdaterStatus;
  percent: number;
  bytesLoaded: number;
  bytesTotal: number;
  notes: string;
  releaseUrl: string;
  error: string | null;
  isAvailable: boolean;
  isDownloading: boolean;
  isDownloaded: boolean;
  check: () => Promise<void>;
  download: () => Promise<void>;
  install: () => Promise<void>;
}

export function useUpdater(bridgeKey: string = 'updater'): UseUpdaterReturn {
  const [currentVersion, setCurrentVersion] = useState<string>('...');
  const [targetVersion, setTargetVersion] = useState<string | null>(null);
  const [status, setStatus] = useState<UpdaterStatus>('idle');
  const [percent, setPercent] = useState<number>(0);
  const [bytesLoaded, setBytesLoaded] = useState<number>(0);
  const [bytesTotal, setBytesTotal] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [releaseUrl, setReleaseUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const getBridge = useCallback((): IUpdaterBridge | undefined => {
    return (window as any)[bridgeKey];
  }, [bridgeKey]);

  useEffect(() => {
    let mounted = true;
    const bridge = getBridge();
    if (!bridge) return;

    bridge.getVersion?.()
      .then((ver) => {
        if (mounted && ver) {
          setCurrentVersion(ver);
        }
      })
      .catch(() => {});

    const unsubscribe = bridge.onEvent?.((event: UpdateEvent) => {
      if (!mounted) return;

      switch (event.type) {
        case 'checking':
          setStatus('checking');
          setError(null);
          break;
        case 'available': {
          setStatus('available');
          const info = event.info as UpdateInfo | undefined;
          if (info?.version) setTargetVersion(info.version);
          if (info?.notes) setNotes(info.notes);
          if (info?.url) setReleaseUrl(info.url);
          break;
        }
        case 'none':
          setStatus('up-to-date');
          break;
        case 'progress':
          setStatus('downloading');
          setPercent(Math.round(event.percent || 0));
          if (event.loaded !== undefined) setBytesLoaded(event.loaded);
          if (event.total !== undefined) setBytesTotal(event.total);
          break;
        case 'downloaded':
          setStatus('downloaded');
          setPercent(100);
          break;
        case 'installing':
          setStatus('installing');
          break;
        case 'error':
          setStatus('error');
          setError(event.error || 'Unknown update error');
          break;
      }
    });

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [getBridge]);

  const check = useCallback(async () => {
    const bridge = getBridge();
    if (!bridge) {
      setError('Updater bridge is not found in window');
      setStatus('error');
      return;
    }

    setStatus('checking');
    setError(null);

    try {
      const res = await bridge.check();
      if (!res.ok) {
        setStatus('error');
        setError(res.error || 'Update check failed');
        return;
      }

      if (res.hasUpdate && res.info) {
        setStatus('available');
        setTargetVersion(res.info.version);
        setNotes(res.info.notes || '');
        setReleaseUrl(res.info.url || '');
      } else {
        setStatus('up-to-date');
      }
    } catch (err: any) {
      setStatus('error');
      setError(String(err?.message || err));
    }
  }, [getBridge]);

  const download = useCallback(async () => {
    const bridge = getBridge();
    if (!bridge) return;

    setStatus('downloading');
    setPercent(0);
    setError(null);

    try {
      const res = await bridge.download();
      if (!res.ok) {
        setStatus('error');
        setError(res.error || 'Download failed');
      }
    } catch (err: any) {
      setStatus('error');
      setError(String(err?.message || err));
    }
  }, [getBridge]);

  const install = useCallback(async () => {
    const bridge = getBridge();
    if (!bridge) return;

    setStatus('installing');
    try {
      const res = await bridge.install();
      if (!res.ok) {
        setStatus('error');
        setError(res.error || 'Installation failed');
      }
    } catch (err: any) {
      setStatus('error');
      setError(String(err?.message || err));
    }
  }, [getBridge]);

  return {
    currentVersion,
    targetVersion,
    status,
    percent,
    bytesLoaded,
    bytesTotal,
    notes,
    releaseUrl,
    error,
    isAvailable: status === 'available',
    isDownloading: status === 'downloading',
    isDownloaded: status === 'downloaded',
    check,
    download,
    install
  };
}
