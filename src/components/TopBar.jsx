import React from 'react'
import { Search, X, Plus } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'

export default function TopBar({
  title,
  count,
  searchQuery,
  setSearchQuery,
  onAddNew
}) {
  const { t } = useI18n()

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <h1 className="current-view-title">{title}</h1>
      </div>

      <div className="top-bar-right">
        <div className="search-box">
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            className="search-input"
            placeholder={t('topbar.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button className="btn-primary" onClick={onAddNew}>
          <Plus size={16} />
          <span>{t('topbar.newRecipeBtn')}</span>
        </button>
      </div>
    </header>
  )
}
