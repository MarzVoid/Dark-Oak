import React from 'react';

export interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string | null;
  notes: string;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  version,
  notes
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="mzp-updater-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mzp-updater-modal-panel">
        <div className="mzp-updater-modal-header">
          <div className="mzp-updater-modal-title">
            Список изменений {version ? `v${version}` : ''}
          </div>
          <button
            type="button"
            className="mzp-updater-modal-close"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="mzp-updater-modal-content">
          {notes ? (
            <pre className="mzp-updater-notes-pre">{notes}</pre>
          ) : (
            <div className="mzp-updater-notes-empty">Описание релиза отсутствует</div>
          )}
        </div>

        <div className="mzp-updater-modal-footer">
          <button
            type="button"
            className="mzp-updater-btn mzp-updater-btn-secondary"
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
