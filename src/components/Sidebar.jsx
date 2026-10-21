import React, { useState } from 'react'
import {
  Download,
  Upload,
  Plus,
  X,
  Trash2
} from 'lucide-react'
import darkOakSaplingImg from '../assets/dark_oak_sapling.png'
import { useI18n } from '../i18n/I18nContext'

export default function Sidebar({
  currentFilter,
  setCurrentFilter,
  recipes,
  categories,
  onExport,
  onImport,
  onAddCategory,
  onDeleteCategory
}) {
  const { t } = useI18n()
  const [categoryToDelete, setCategoryToDelete] = useState(null)

  const allCount = recipes.length
  const favCount = recipes.filter(r => r.isFavorite).length

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon-wrapper">
              <img src={darkOakSaplingImg} alt="Dark Oak" className="brand-tree-img" />
            </div>
            <div className="brand-text">
              <span className="brand-title">Dark Oak</span>
            </div>
          </div>
        </div>

        <div className="sidebar-content">
          <div className="nav-section">
            <button
              className={`nav-item ${currentFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCurrentFilter('all')}
            >
              <div className="nav-item-left">
                <span>{t('sidebar.allRecipes')}</span>
              </div>
            </button>

            <button
              className={`nav-item ${currentFilter === 'favorites' ? 'active' : ''}`}
              onClick={() => setCurrentFilter('favorites')}
            >
              <div className="nav-item-left">
                <span>{t('sidebar.favorites')}</span>
              </div>
              <span className="nav-badge">{favCount}</span>
            </button>

            <div className="sidebar-divider" />

            <button
              className={`nav-item ${currentFilter === 'settings' ? 'active' : ''}`}
              onClick={() => setCurrentFilter('settings')}
              title={t('sidebar.settings')}
            >
              <div className="nav-item-left">
                <span>{t('sidebar.settings')}</span>
              </div>
            </button>

            <div className="sidebar-divider" />

            <button
              className="nav-item add-category-btn"
              onClick={onAddCategory}
              title={t('sidebar.addCategory')}
            >
              <div className="nav-item-left">
                <span>{t('sidebar.addCategory')}</span>
              </div>
              <Plus size={14} />
            </button>

            {categories.length > 0 && <div className="sidebar-divider" />}

            {categories.map(category => {
              const count = recipes.filter(r => r.category === category).length
              const isActive = currentFilter === `cat:${category}`
              return (
                <div
                  key={category}
                  className={`nav-item category-item ${isActive ? 'active' : ''}`}
                  onClick={() => setCurrentFilter(`cat:${category}`)}
                >
                  <div className="nav-item-left">
                    <span>{category}</span>
                  </div>
                  <div className="category-item-right">
                    <span className="nav-badge">{count}</span>
                    {onDeleteCategory && (
                      <button
                        className="category-delete-btn"
                        title="Удалить категорию"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCategoryToDelete(category)
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </aside>

      {categoryToDelete && (
        <div className="modal-backdrop" onClick={() => setCategoryToDelete(null)}>
          <div
            className="modal-sheet"
            style={{
              maxWidth: '420px',
              padding: '24px',
              background: '#0e0e0e',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0
              }}>
                <Trash2 size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                  Удалить категорию?
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#a8a29e', lineHeight: 1.45 }}>
                  Категория «{categoryToDelete}» будет удалена. Рецепты останутся в общем списке.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  background: '#1a1a1a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#eaeaea'
                }}
                onClick={() => setCategoryToDelete(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '8px 20px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  onDeleteCategory(categoryToDelete)
                  setCategoryToDelete(null)
                }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
