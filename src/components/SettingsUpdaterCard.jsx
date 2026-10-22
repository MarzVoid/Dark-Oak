import React from 'react'
import { useUpdater } from '@marzipan/updater/react'
import { useI18n } from '../i18n/I18nContext'

export default function SettingsUpdaterCard() {
  const { t, language } = useI18n()
  const {
    currentVersion,
    targetVersion,
    status,
    percent,
    error,
    check,
    download,
    install
  } = useUpdater('updater')

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      width: '360px',
      height: '185px',
      boxSizing: 'border-box',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('settings.updatesTitle')}
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('settings.updatesDesc')}
          </p>
        </div>
        <div style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(212, 155, 101, 0.15)',
          color: '#d49b65',
          border: '1px solid rgba(212, 155, 101, 0.25)',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          v{currentVersion}
        </div>
      </div>

      <div style={{ minHeight: '20px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {status === 'checking' && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {t('settings.checkingUpdates')}
          </div>
        )}

        {status === 'up-to-date' && (
          <div style={{ fontSize: '0.82rem', color: '#4ade80' }}>
            {t('settings.latestVersionInstalled')}
          </div>
        )}

        {status === 'available' && (
          <div style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600 }}>
            {t('settings.newVersionAvailable')}{targetVersion}
          </div>
        )}

        {status === 'downloading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>{t('settings.downloadingUpdate')}</span>
              <span>{percent}%</span>
            </div>
            <div style={{ height: '5px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${percent}%`, background: '#d49b65', transition: 'width 0.2s' }} />
            </div>
          </div>
        )}

        {status === 'downloaded' && (
          <div style={{ fontSize: '0.82rem', color: '#4ade80' }}>
            {t('settings.updateDownloadedReady')}
          </div>
        )}

        {status === 'error' && (
          <div style={{ fontSize: '0.82rem', color: '#f87171' }}>
            {error || 'Error'}
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto' }}>
        {(status === 'idle' || status === 'up-to-date' || status === 'error') && (
          <button
            type="button"
            className="btn-secondary"
            onClick={check}
            style={{ height: '38px', width: '100%', justifyContent: 'center' }}
          >
            {t('settings.checkUpdatesBtn')}
          </button>
        )}

        {status === 'available' && (
          <button
            type="button"
            className="btn-primary"
            onClick={download}
            style={{ height: '38px', width: '100%', justifyContent: 'center' }}
          >
            {t('settings.downloadUpdateBtn')}
          </button>
        )}

        {status === 'downloaded' && (
          <button
            type="button"
            className="btn-primary"
            onClick={install}
            style={{ height: '38px', width: '100%', justifyContent: 'center' }}
          >
            {t('settings.installRestartBtn')}
          </button>
        )}
      </div>
    </div>
  )
}
