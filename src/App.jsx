import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import RecipeCard from './components/RecipeCard'
import RecipeView from './components/RecipeView'
import RecipeEditorView from './components/RecipeEditorView'
import AddCategoryModal from './components/AddCategoryModal'
import SetupModal from './components/SetupModal'
import { initialRecipes } from './data/initialRecipes'
import { Plus, Utensils, Globe, Folder, FolderOpen, Check, Sparkles } from 'lucide-react'
import { UpdateCard } from '@marzipan/updater/react'
import '@marzipan/updater/react/style.css'
import igolochkaBranch from './assets/igolochka.png'
import { useI18n } from './i18n/I18nContext'

export default function App() {
  const { t, language, setLanguage } = useI18n()
  const [recipes, setRecipes] = useState([])
  const [categories, setCategories] = useState([])
  const [currentFilter, setCurrentFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [appVersion, setAppVersion] = useState('')
  const [recipesDir, setRecipesDir] = useState('')
  const [showSetupModal, setShowSetupModal] = useState(() => {
    return !localStorage.getItem('dark_oak_setup_done')
  })

  useEffect(() => {
    if (window.updater && window.updater.getVersion) {
      window.updater.getVersion().then(ver => {
        if (ver) setAppVersion(ver)
      }).catch(() => { })
    }
    if (window.cherryApi && window.cherryApi.getRecipesDir) {
      window.cherryApi.getRecipesDir().then(res => {
        if (res && res.dir) {
          setRecipesDir(res.dir)
          localStorage.setItem('dark_oak_recipes_dir', res.dir)
        }
      }).catch(() => {})
    }
  }, [])

  const loadData = async () => {
    let loadedRecipes = null
    let loadedCategories = null

    if (window.cherryApi && window.cherryApi.loadRecipes) {
      try {
        const electronData = await window.cherryApi.loadRecipes()
        if (electronData) {
          if (Array.isArray(electronData.recipes)) loadedRecipes = electronData.recipes
          if (Array.isArray(electronData.categories)) loadedCategories = electronData.categories
        }
      } catch (e) {
      }
    }

    if (!loadedRecipes) {
      const localData = localStorage.getItem('dark_oak_recipes') || localStorage.getItem('cherry_recipes')
      if (localData) {
        try {
          const parsed = JSON.parse(localData)
          if (Array.isArray(parsed)) loadedRecipes = parsed
        } catch (e) {
        }
      }
    }

    if (!loadedCategories) {
      const localCats = localStorage.getItem('dark_oak_categories')
      if (localCats) {
        try {
          const parsed = JSON.parse(localCats)
          if (Array.isArray(parsed)) loadedCategories = parsed
        } catch (e) {
        }
      }
    }

    setRecipes(loadedRecipes || initialRecipes)
    setCategories(loadedCategories || [])
    setLoaded(true)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!loaded) return

    localStorage.setItem('dark_oak_recipes', JSON.stringify(recipes))
    localStorage.setItem('dark_oak_categories', JSON.stringify(categories))

    if (window.cherryApi && window.cherryApi.saveRecipes) {
      window.cherryApi.saveRecipes({ recipes, categories })
    }
  }, [recipes, categories, loaded])

  const handleToggleFavorite = (id) => {
    setRecipes(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, isFavorite: !r.isFavorite }
      }
      return r
    }))

    if (selectedRecipe && selectedRecipe.id === id) {
      setSelectedRecipe(prev => ({ ...prev, isFavorite: !prev.isFavorite }))
    }
  }

  const handleDeleteRecipe = (id) => {
    setRecipes(prev => prev.filter(r => r.id !== id))
    setSelectedRecipe(null)
  }

  const handleSaveRecipe = (recipeData) => {
    setRecipes(prev => {
      const exists = prev.some(r => r.id === recipeData.id)
      if (exists) {
        return prev.map(r => (r.id === recipeData.id ? recipeData : r))
      }
      return [recipeData, ...prev]
    })

    if (recipeData.category && !categories.includes(recipeData.category)) {
      setCategories(prev => [...prev, recipeData.category])
    }

    setEditingRecipe(null)
    setIsCreating(false)
    setSelectedRecipe(recipeData)
  }

  const handleCreateCategory = (name) => {
    if (!categories.includes(name)) {
      setCategories(prev => [...prev, name])
    }
    setIsAddingCategory(false)
  }

  const handleDeleteCategory = (catToDelete) => {
    setCategories(prev => prev.filter(c => c !== catToDelete))
    setRecipes(prev => prev.map(r => {
      if (r.category === catToDelete) {
        return { ...r, category: '' }
      }
      return r
    }))
    if (currentFilter === `cat:${catToDelete}`) {
      setCurrentFilter('all')
    }
  }

  const handleSelectDirectory = async () => {
    if (window.cherryApi && window.cherryApi.selectDirectory) {
      try {
        const res = await window.cherryApi.selectDirectory()
        if (res && res.success && res.path) {
          await window.cherryApi.setRecipesDir(res.path)
          setRecipesDir(res.path)
          localStorage.setItem('dark_oak_recipes_dir', res.path)
          loadData()
        }
      } catch (e) {
      }
    }
  }

  const handleSetupComplete = (newDir) => {
    setShowSetupModal(false)
    if (newDir) {
      setRecipesDir(newDir)
      loadData()
    }
  }

  let filteredRecipes = recipes
  if (currentFilter === 'favorites') {
    filteredRecipes = filteredRecipes.filter(r => r.isFavorite)
  } else if (currentFilter.startsWith('cat:')) {
    const catName = currentFilter.replace('cat:', '')
    filteredRecipes = filteredRecipes.filter(r => r.category === catName)
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim()
    filteredRecipes = filteredRecipes.filter(r => {
      const titleMatch = r.title.toLowerCase().includes(q)
      const descMatch = (r.description || '').toLowerCase().includes(q)
      const ingredientMatch = r.ingredients && r.ingredients.some(i => i.name.toLowerCase().includes(q))
      return titleMatch || descMatch || ingredientMatch
    })
  }

  const getFilterTitle = () => {
    if (currentFilter === 'all') return t('topbar.allTitle')
    if (currentFilter === 'favorites') return t('topbar.favTitle')
    if (currentFilter === 'settings') return t('topbar.settingsTitle')
    if (currentFilter.startsWith('cat:')) return currentFilter.replace('cat:', '')
    return t('app.title')
  }

  const handleFilterChange = (filter) => {
    setIsCreating(false)
    setEditingRecipe(null)
    setSelectedRecipe(null)
    setCurrentFilter(filter)
  }

  return (
    <div className="app-container">
      <Sidebar
        currentFilter={currentFilter}
        setCurrentFilter={handleFilterChange}
        recipes={recipes}
        categories={categories}
        onAddCategory={() => setIsAddingCategory(true)}
        onDeleteCategory={handleDeleteCategory}
      />

      <main className="main-layout">
        {isCreating || editingRecipe ? (
          <RecipeEditorView
            recipe={editingRecipe}
            categories={categories}
            onSave={(finalRecipe) => {
              handleSaveRecipe(finalRecipe)
              setIsCreating(false)
              setEditingRecipe(null)
            }}
            onCancel={() => {
              setIsCreating(false)
              setEditingRecipe(null)
            }}
          />
        ) : selectedRecipe ? (
          <RecipeView
            recipe={selectedRecipe}
            onBack={() => setSelectedRecipe(null)}
            onEdit={(r) => {
              setEditingRecipe(r)
              setSelectedRecipe(null)
            }}
            onDelete={handleDeleteRecipe}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <>
            <TopBar
              title={getFilterTitle()}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAddNew={() => setIsCreating(true)}
            />

            <div className="content-scrollable">
              <div className="content-corner-branch">
                <img src={igolochkaBranch} alt="" className="corner-branch-img" />
              </div>
              {currentFilter === 'settings' ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '20px',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  paddingTop: '60px',
                  maxWidth: '1000px'
                }}>
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    flex: '1',
                    minWidth: '300px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Globe size={20} color="var(--oak-300)" />
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700, margin: 0 }}>
                        {t('settings.languageTitle')}
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                      {t('settings.languageDesc')}
                    </p>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setLanguage('ru')}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: language === 'ru' ? 'rgba(212, 155, 101, 0.2)' : 'var(--bg-surface)',
                          border: language === 'ru' ? '1.5px solid var(--oak-400)' : '1px solid var(--border-subtle)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        <span>Русский</span>
                        {language === 'ru' && <Check size={16} color="var(--oak-300)" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: language === 'en' ? 'rgba(212, 155, 101, 0.2)' : 'var(--bg-surface)',
                          border: language === 'en' ? '1.5px solid var(--oak-400)' : '1px solid var(--border-subtle)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        <span>English</span>
                        {language === 'en' && <Check size={16} color="var(--oak-300)" />}
                      </button>
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    flex: '1.2',
                    minWidth: '320px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Folder size={20} color="var(--oak-300)" />
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700, margin: 0 }}>
                        {t('settings.directoryTitle')}
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                      {t('settings.directoryDesc')}
                    </p>

                    <div style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      wordBreak: 'break-all'
                    }}>
                      {recipesDir || 'По умолчанию (Документы / Dark Oak)'}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleSelectDirectory}
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <FolderOpen size={16} />
                        <span>{t('settings.changeDirBtn')}</span>
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowSetupModal(true)}
                        style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Sparkles size={15} color="var(--oak-400)" />
                        <span>{t('settings.openSetupBtn')}</span>
                      </button>
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    flex: '1',
                    minWidth: '280px',
                    maxWidth: '380px'
                  }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700, margin: 0 }}>
                      {t('settings.aboutTitle')}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                      Dark Oak Desktop {appVersion ? `v${appVersion}` : ''}
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {t('settings.savedRecipesCount')} {recipes.length} · {t('settings.categoriesCount')} {categories.length}
                    </p>
                  </div>

                  <div style={{ flex: '1.2', minWidth: '320px', maxWidth: '500px' }}>
                    <UpdateCard title="Обновление Dark Oak" description="Автоматическая проверка и загрузка новых релизов" />
                  </div>
                </div>
              ) : filteredRecipes.length > 0 ? (
                <div className="recipe-grid">
                  {filteredRecipes.map(recipe => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onSelect={(r) => setSelectedRecipe(r)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon-wrap">
                    <Utensils size={32} />
                  </div>
                  <h3 className="empty-title">{t('empty.title')}</h3>
                  <p className="empty-desc">
                    {searchQuery
                      ? t('empty.searchDesc')
                      : t('empty.emptyDesc')}
                  </p>
                  <button className="btn-primary" onClick={() => setIsCreating(true)}>
                    <Plus size={16} />
                    <span>{t('empty.createBtn')}</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {showSetupModal && (
        <SetupModal
          initialDir={recipesDir}
          onComplete={handleSetupComplete}
        />
      )}

      {isAddingCategory && (
        <AddCategoryModal
          onAdd={handleCreateCategory}
          onClose={() => setIsAddingCategory(false)}
          existingCategories={categories}
        />
      )}
    </div>
  )
}
