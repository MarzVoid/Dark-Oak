import React, { useState } from 'react'
import { X, Plus, FolderPlus } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'

export default function AddCategoryModal({ onAdd, onClose, existingCategories }) {
  const { t } = useI18n()
  const [categoryName, setCategoryName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = categoryName.trim()
    if (!trimmed) {
      setError(t('categoryModal.errorEmpty'))
      return
    }

    if (existingCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setError(t('categoryModal.errorExists'))
      return
    }

    onAdd(trimmed)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet"
        style={{
          maxWidth: '440px',
          padding: '0',
          background: '#0e0e0e',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sidebar-header"
          style={{
            padding: '16px 20px',
            background: '#0e0e0e',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderPlus size={18} color="var(--oak-300)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
              {t('categoryModal.title')}
            </h3>
          </div>
          <button className="clear-search-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#0e0e0e' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#d5c4b5' }}>
                {t('categoryModal.nameLabel')}
              </label>
              <input
                type="text"
                className="form-input"
                style={{
                  background: '#161616',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#ffffff'
                }}
                placeholder={t('categoryModal.placeholder')}
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value)
                  if (error) setError('')
                }}
                autoFocus
              />
              {error && (
                <span style={{ fontSize: '0.8rem', color: '#f87171' }}>
                  {error}
                </span>
              )}
            </div>
          </div>

          <div
            className="modal-actions-bar"
            style={{
              padding: '14px 20px',
              background: '#0e0e0e',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              style={{
                background: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#eaeaea'
              }}
              onClick={onClose}
            >
              {t('categoryModal.cancelBtn')}
            </button>
            <button type="submit" className="btn-primary">
              <Plus size={16} />
              <span>{t('categoryModal.addBtn')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
