import React, { useState } from 'react';
import { useUpdater } from './useUpdater';
import { UpdateModal } from './UpdateModal';

export interface UpdateCardProps {
  title?: string;
  description?: string;
  className?: string;
  bridgeKey?: string;
}

export const UpdateCard: React.FC<UpdateCardProps> = ({
  title = 'Обновления программы',
  description = 'Автоматическая проверка и загрузка новых релизов',
  className = '',
  bridgeKey = 'updater'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    currentVersion,
    targetVersion,
    status,
    percent,
    bytesLoaded,
    bytesTotal,
    notes,
    error,
    check,
    download,
    install
  } = useUpdater(bridgeKey);

  return (
    <div className={`mzp-updater-card ${className}`}>
      <div className="mzp-updater-header">
        <div>
          <div className="mzp-updater-title">{title}</div>
          <div className="mzp-updater-desc">{description}</div>
        </div>
        <div className="mzp-updater-version-badge">
          v{currentVersion}
        </div>
      </div>

      <div className="mzp-updater-body">
        {status === 'checking' && (
          <div className="mzp-updater-status-row">
            <div className="mzp-updater-spinner" />
            <span className="mzp-updater-status-text">Проверка наличия обновлений...</span>
          </div>
        )}

        {status === 'up-to-date' && (
          <div className="mzp-updater-status-row mzp-updater-text-success">
            <span className="mzp-updater-dot mzp-updater-dot-success" />
            <span>Установлена актуальная версия.</span>
          </div>
        )}

        {status === 'available' && (
          <div className="mzp-updater-status-row mzp-updater-text-highlight">
            <span className="mzp-updater-dot mzp-updater-dot-highlight" />
            <span>Доступна новая версия: v{targetVersion}</span>
          </div>
        )}

        {status === 'downloading' && (
          <div className="mzp-updater-progress-wrapper">
            <div className="mzp-updater-progress-header">
              <span>Загрузка обновления...</span>
              <span>
                {bytesTotal > 0
                  ? `Скачано ${(bytesLoaded / (1024 * 1024)).toFixed(1)} МБ из ${(bytesTotal / (1024 * 1024)).toFixed(1)} МБ (${percent}%)`
                  : `${percent}%`}
              </span>
            </div>
            <div className="mzp-updater-progress-bar">
              <div
                className="mzp-updater-progress-fill"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        {status === 'installing' && (
          <div className="mzp-updater-status-row">
            <div className="mzp-updater-spinner" />
            <span className="mzp-updater-status-text">Установка обновления и перезапуск...</span>
          </div>
        )}

        {status === 'downloaded' && (
          <div className="mzp-updater-status-row mzp-updater-text-success">
            <span className="mzp-updater-dot mzp-updater-dot-success" />
            <span>
              {bytesTotal > 0
                ? `Скачано ${(bytesTotal / (1024 * 1024)).toFixed(1)} МБ. Готово к установке.`
                : 'Обновление скачано. Готово к установке.'}
            </span>
          </div>
        )}

        {status === 'error' && (
          <div className="mzp-updater-status-row mzp-updater-text-error">
            <span className="mzp-updater-dot mzp-updater-dot-error" />
            <span>Ошибка: {error}</span>
          </div>
        )}
      </div>

      <div className="mzp-updater-actions">
        {(status === 'idle' || status === 'up-to-date' || status === 'error') && (
          <button
            type="button"
            className="mzp-updater-btn mzp-updater-btn-secondary"
            onClick={check}
          >
            Проверить обновления
          </button>
        )}

        {status === 'checking' && (
          <button
            type="button"
            className="mzp-updater-btn mzp-updater-btn-secondary"
            disabled
          >
            Проверяю...
          </button>
        )}

        {status === 'available' && (
          <>
            <button
              type="button"
              className="mzp-updater-btn mzp-updater-btn-primary"
              onClick={download}
            >
              Скачать v{targetVersion}
            </button>
            {notes && (
              <button
                type="button"
                className="mzp-updater-btn mzp-updater-btn-ghost"
                onClick={() => setIsModalOpen(true)}
              >
                Что нового?
              </button>
            )}
          </>
        )}

        {status === 'downloading' && (
          <button
            type="button"
            className="mzp-updater-btn mzp-updater-btn-secondary"
            disabled
          >
            Скачивание {percent}%
          </button>
        )}

        {status === 'downloaded' && (
          <>
            <button
              type="button"
              className="mzp-updater-btn mzp-updater-btn-accent"
              onClick={install}
            >
              Перезапустить
            </button>
            {notes && (
              <button
                type="button"
                className="mzp-updater-btn mzp-updater-btn-ghost"
                onClick={() => setIsModalOpen(true)}
              >
                Что нового?
              </button>
            )}
          </>
        )}

        {status === 'installing' && (
          <button
            type="button"
            className="mzp-updater-btn mzp-updater-btn-secondary"
            disabled
          >
            Перезапуск...
          </button>
        )}
      </div>

      <UpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        version={targetVersion}
        notes={notes}
      />
    </div>
  );
};
