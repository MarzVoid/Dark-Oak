import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import RecipeCard from './components/RecipeCard'
import RecipeView from './components/RecipeView'
import RecipeEditorView from './components/RecipeEditorView'
import AddCategoryModal from './components/AddCategoryModal'
import SetupModal from './components/SetupModal'
import { initialRecipes } from './data/initialRecipes'
import { Plus, Utensils } from 'lucide-react'
import SettingsUpdaterCard from './components/SettingsUpdaterCard'
import igolochkaBranch from './assets/igolochka.png'
import { useI18n } from './i18n/I18nContext'
import {
  getLocalizedRecipe,
  translateRecipe,
  hasCyrillic,
  translateCategory
} from './utils/recipeTranslator'

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
  const [showSetupModal, setShowSetupModal] = useState(true)

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

  useEffect(() => {
    if (!loaded || !recipes.length) return

    let isMounted = true
    const untranslated = recipes.filter(r => {
      const isRu = hasCyrillic(r.title || r.description || '')
      if (language === 'ru' && !isRu) {
        return !r.translations || !r.translations.ru
      }
      if (language === 'en' && isRu) {
        return !r.translations || !r.translations.en
      }
      return false
    })

    if (untranslated.length === 0) return

    async function runAutoTranslate() {
      try {
        const updatedList = await Promise.all(
          untranslated.map(r => translateRecipe(r, language))
        )
        if (!isMounted) return

        setRecipes(prev => {
          const updateMap = {}
          updatedList.forEach(u => {
            if (u && u.id) updateMap[u.id] = u
          })
          return prev.map(r => updateMap[r.id] || r)
        })
      } catch (e) {}
    }

    runAutoTranslate()

    return () => {
      isMounted = false
    }
  }, [language, recipes, loaded])

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
      const exists = prev.find(r => r.id === recipeData.id)
      if (exists) {
        return prev.map(r => (r.id === recipeData.id ? { ...exists, ...recipeData, translations: {} } : r))
      }
      return [{ ...recipeData, translations: {} }, ...prev]
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

  const localizedRecipes = recipes.map(r => getLocalizedRecipe(r, language))

  let filteredRecipes = localizedRecipes
  if (currentFilter === 'favorites') {
    filteredRecipes = filteredRecipes.filter(r => r.isFavorite)
  } else if (currentFilter.startsWith('cat:')) {
    const catName = currentFilter.replace('cat:', '')
    filteredRecipes = filteredRecipes.filter((r, idx) => {
      const orig = recipes[idx] || r
      return (
        r.category === catName ||
        orig.category === catName ||
        translateCategory(orig.category, language) === catName ||
        translateCategory(catName, language) === r.category
      )
    })
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim()
    filteredRecipes = filteredRecipes.filter((r, idx) => {
      const orig = recipes[idx] || r
      const titleMatch = r.title.toLowerCase().includes(q) || orig.title.toLowerCase().includes(q)
      const descMatch = (r.description || '').toLowerCase().includes(q) || (orig.description || '').toLowerCase().includes(q)
      const ingredientMatch =
        (r.ingredients && r.ingredients.some(i => (i.name || '').toLowerCase().includes(q))) ||
        (orig.ingredients && orig.ingredients.some(i => (i.name || '').toLowerCase().includes(q)))
      return titleMatch || descMatch || ingredientMatch
    })
  }

  const getFilterTitle = () => {
    if (currentFilter === 'all') return t('topbar.allTitle')
    if (currentFilter === 'favorites') return t('topbar.favTitle')
    if (currentFilter === 'settings') return t('topbar.settingsTitle')
    if (currentFilter.startsWith('cat:')) {
      const cat = currentFilter.replace('cat:', '')
      return translateCategory(cat, language) || cat
    }
    return t('app.title')
  }

  const handleFilterChange = (filter) => {
    setIsCreating(false)
    setEditingRecipe(null)
    setSelectedRecipe(null)
    setCurrentFilter(filter)
  }

  const activeSelectedRecipe = selectedRecipe
    ? getLocalizedRecipe(recipes.find(r => r.id === selectedRecipe.id) || selectedRecipe, language)
    : null

  return (
    <div className="app-container">
      <Sidebar
        currentFilter={currentFilter}
        setCurrentFilter={handleFilterChange}
        recipes={recipes}
        categories={categories}
        onAddCategory={() => setIsAddingCategory(true)}
        onDeleteCategory={handleDeleteCategory}
        onOpenSetup={() => setShowSetupModal(true)}
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
        ) : activeSelectedRecipe ? (
          <RecipeView
            recipe={activeSelectedRecipe}
            onBack={() => setSelectedRecipe(null)}
            onEdit={(r) => {
              const orig = recipes.find(item => item.id === r.id) || r
              setEditingRecipe(orig)
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
                  gap: '16px',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  paddingTop: '64px',
                  paddingLeft: '12px'
                }}>
                  <SettingsUpdaterCard />

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
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t('settings.languageTitle')}
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t('settings.languageDesc')}
                    </p>

                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                      <button
                        type="button"
                        onClick={() => setLanguage('ru')}
                        style={{
                          flex: 1,
                          height: '38px',
                          borderRadius: 'var(--radius-md)',
                          background: language === 'ru' ? 'rgba(212, 155, 101, 0.2)' : 'var(--bg-surface)',
                          border: language === 'ru' ? '1.5px solid var(--oak-400)' : '1px solid var(--border-subtle)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        Русский
                      </button>

                      <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        style={{
                          flex: 1,
                          height: '38px',
                          borderRadius: 'var(--radius-md)',
                          background: language === 'en' ? 'rgba(212, 155, 101, 0.2)' : 'var(--bg-surface)',
                          border: language === 'en' ? '1.5px solid var(--oak-400)' : '1px solid var(--border-subtle)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        English
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
                    width: '360px',
                    height: '185px',
                    boxSizing: 'border-box',
                    flexShrink: 0
                  }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t('settings.directoryTitle')}
                    </h3>
                    <p style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-muted)',
                      margin: '4px 0 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {recipesDir || (language === 'ru' ? 'По умолчанию (Документы / Dark Oak)' : 'Default (Documents / Dark Oak)')}
                    </p>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSelectDirectory}
                      style={{
                        marginTop: 'auto',
                        height: '38px',
                        width: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      {t('settings.changeDirBtn')}
                    </button>
                  </div>
                </div>
              ) : filteredRecipes.length > 0 ? (
                <div className="recipe-grid">
                  {filteredRecipes.map(recipe => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onSelect={(r) => {
                        const orig = recipes.find(item => item.id === r.id) || r
                        setSelectedRecipe(orig)
                      }}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon-wrap">
                    <Utensils size={30} />
                  </div>
                  <h3 className="empty-title">
                    {searchQuery ? t('empty.searchTitle') : t('empty.title')}
                  </h3>
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
