import React, { useState } from 'react'
import {
  ArrowLeft,
  Heart,
  Edit3,
  Trash2,
  Star,
  Minus,
  Plus,
  Check,
  Layers,
  Clock
} from 'lucide-react'
import { IngredientIcon } from '../utils/ingredientIcons'
import { RecipeIconImg, detectRecipeIcon, detectStepActionIcon } from '../utils/recipeIcons'
import { useI18n } from '../i18n/I18nContext'

export default function RecipeView({
  recipe,
  onBack,
  onEdit,
  onDelete,
  onToggleFavorite
}) {
  const { t, language } = useI18n()
  const [checkedIngredients, setCheckedIngredients] = useState({})
  const [completedSteps, setCompletedSteps] = useState({})
  const [servingsMultiplier, setServingsMultiplier] = useState(recipe.servings || 2)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const recipeIcon = recipe.icon || detectRecipeIcon(recipe.title, recipe.category)

  const baseServings = recipe.servings || 2
  const ratio = servingsMultiplier / baseServings

  const toggleCheck = (index) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const toggleStep = (index) => {
    setCompletedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const handleMinusServings = () => {
    if (servingsMultiplier > 1) {
      setServingsMultiplier(prev => prev - 1)
    }
  }

  const handlePlusServings = () => {
    if (servingsMultiplier < 20) {
      setServingsMultiplier(prev => prev + 1)
    }
  }

  const formatAmount = (origAmount) => {
    if (!origAmount || isNaN(origAmount)) return origAmount || ''
    const val = Number(origAmount) * ratio
    return Number.isInteger(val) ? val : val.toFixed(1)
  }

  const hasSections = recipe.ingredients && recipe.ingredients.some(i => i.section)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <header className="top-bar">
        <div className="top-bar-left">
          <button type="button" className="btn-secondary" onClick={onBack} title="Назад к рецептам">
            <ArrowLeft size={16} />
            <span>Назад</span>
          </button>
          <h1 className="current-view-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {recipeIcon && <RecipeIconImg icon={recipeIcon} size={24} />}
            <span>{recipe.title}</span>
          </h1>
          {recipe.category && (
            <span
              style={{
                marginLeft: '10px',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 600,
                background: 'rgba(212, 155, 101, 0.15)',
                border: '1px solid rgba(212, 155, 101, 0.3)',
                color: '#d49b65',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {recipe.category}
            </span>
          )}
        </div>

        <div className="top-bar-right">
          <button
            type="button"
            className={`btn-secondary ${recipe.isFavorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(recipe.id)}
            style={{
              borderColor: recipe.isFavorite ? 'rgba(212, 155, 101, 0.5)' : undefined,
              color: recipe.isFavorite ? '#d49b65' : undefined
            }}
          >
            <Heart
              size={15}
              fill={recipe.isFavorite ? '#d49b65' : 'none'}
              color={recipe.isFavorite ? '#d49b65' : 'currentColor'}
            />
            <span>{recipe.isFavorite ? t('view.favoriteActive') : t('view.favoriteAdd')}</span>
          </button>

          <button type="button" className="btn-secondary" onClick={() => onEdit(recipe)}>
            <Edit3 size={15} />
            <span>{t('view.edit')}</span>
          </button>

          <button
            type="button"
            className="btn-danger"
            onClick={() => setShowConfirmDelete(true)}
          >
            <Trash2 size={15} />
            <span>{t('view.delete')}</span>
          </button>
        </div>
      </header>

      <div className="content-scrollable">
        <div className="recipe-editor-new-layout">
          <div className="recipe-editor-top-row">
            <div className="recipe-editor-card recipe-editor-card-main">
              <div className="recipe-card-header">
                <div className="recipe-card-header-left">
                  <h3 className="recipe-card-title">Основная информация</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      fill={star <= (recipe.rating || 5) ? '#f5a623' : 'transparent'}
                      color={star <= (recipe.rating || 5) ? '#f5a623' : '#5a4635'}
                    />
                  ))}
                </div>
              </div>

              {recipe.image && (
                <div className="recipe-view-photo-container">
                  <img src={recipe.image} alt={recipe.title} className="recipe-view-photo" />
                </div>
              )}

              <div className="recipe-view-stats">
                <div className="recipe-view-stat-card">
                  <span className="recipe-view-stat-value">{recipe.prepTime || 0} {language === 'ru' ? 'мин' : 'min'}</span>
                  <span className="recipe-view-stat-label">{t('view.prepTimeLabel')}</span>
                </div>
                <div className="recipe-view-stat-card">
                  <span className="recipe-view-stat-value">{recipe.cookTime || 0} {language === 'ru' ? 'мин' : 'min'}</span>
                  <span className="recipe-view-stat-label">{t('view.cookTimeLabel')}</span>
                </div>
                <div className="recipe-view-stat-card">
                  <span className="recipe-view-stat-value">
                    {(Number(recipe.prepTime) || 0) + (Number(recipe.cookTime) || 0)} {language === 'ru' ? 'мин' : 'min'}
                  </span>
                  <span className="recipe-view-stat-label">{language === 'ru' ? 'Всего' : 'Total'}</span>
                </div>
                <div className="recipe-view-stat-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#d49b65',
                        cursor: 'pointer',
                        padding: '0 2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onClick={handleMinusServings}
                    >
                      <Minus size={11} />
                    </button>
                    <span className="recipe-view-stat-value">{servingsMultiplier}</span>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#d49b65',
                        cursor: 'pointer',
                        padding: '0 2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onClick={handlePlusServings}
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                  <span className="recipe-view-stat-label">{t('view.servingsLabel')}</span>
                </div>
              </div>

              {recipe.description && (
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#a8927d', marginBottom: '4px', fontWeight: 600 }}>
                    {language === 'ru' ? 'Описание' : 'Description'}
                  </div>
                  <div className="recipe-view-description">
                    {recipe.description}
                  </div>
                </div>
              )}
            </div>

            <div className="recipe-editor-card recipe-editor-card-ingredients">
              <div className="recipe-card-header">
                <div className="recipe-card-header-left">
                  <h3 className="recipe-card-title">{t('view.ingredientsTitle')}</h3>
                </div>
              </div>

              {!hasSections ? (
                <div className="ingredients-list">
                  {recipe.ingredients && recipe.ingredients.map((ing, idx) => {
                    const isChecked = !!checkedIngredients[idx]
                    return (
                      <div
                        key={idx}
                        className={`ingredient-row ${isChecked ? 'checked' : ''}`}
                        onClick={() => toggleCheck(idx)}
                      >
                        <div className="ingredient-name">
                          <div className="checkbox-custom">
                            {isChecked && <Check size={13} strokeWidth={3} />}
                          </div>
                          <IngredientIcon name={ing.name} icon={ing.icon} size={20} />
                          <span>{ing.name}</span>
                        </div>
                        <span className="ingredient-amount">
                          {formatAmount(ing.amount)} {ing.unit}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                (() => {
                  const sectionsMap = {}
                  const unsectioned = []
                  recipe.ingredients.forEach((ing, idx) => {
                    if (ing.section) {
                      if (!sectionsMap[ing.section]) sectionsMap[ing.section] = []
                      sectionsMap[ing.section].push({ ing, idx })
                    } else {
                      unsectioned.push({ ing, idx })
                    }
                  })

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {Object.entries(sectionsMap).map(([sectionName, items]) => (
                        <div key={sectionName} className="ingredient-section-group">
                          <div className="ingredient-section-header">
                            <Layers size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                            <span>{sectionName}</span>
                          </div>
                          <div className="ingredients-list">
                            {items.map(({ ing, idx }) => {
                              const isChecked = !!checkedIngredients[idx]
                              return (
                                <div
                                  key={idx}
                                  className={`ingredient-row ${isChecked ? 'checked' : ''}`}
                                  onClick={() => toggleCheck(idx)}
                                >
                                  <div className="ingredient-name">
                                    <div className="checkbox-custom">
                                      {isChecked && <Check size={13} strokeWidth={3} />}
                                    </div>
                                    <IngredientIcon name={ing.name} icon={ing.icon} size={20} />
                                    <span>{ing.name}</span>
                                  </div>
                                  <span className="ingredient-amount">
                                    {formatAmount(ing.amount)} {ing.unit}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}

                      {unsectioned.length > 0 && (
                        <div className="ingredient-section-group">
                          <div className="ingredient-section-header">
                            <span>Другое</span>
                          </div>
                          <div className="ingredients-list">
                            {unsectioned.map(({ ing, idx }) => {
                              const isChecked = !!checkedIngredients[idx]
                              return (
                                <div
                                  key={idx}
                                  className={`ingredient-row ${isChecked ? 'checked' : ''}`}
                                  onClick={() => toggleCheck(idx)}
                                >
                                  <div className="ingredient-name">
                                    <div className="checkbox-custom">
                                      {isChecked && <Check size={13} strokeWidth={3} />}
                                    </div>
                                    <IngredientIcon name={ing.name} icon={ing.icon} size={20} />
                                    <span>{ing.name}</span>
                                  </div>
                                  <span className="ingredient-amount">
                                    {formatAmount(ing.amount)} {ing.unit}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()
              )}
            </div>
          </div>

          <div className="recipe-editor-card recipe-editor-card-steps">
            <div className="recipe-card-header">
              <div className="recipe-card-header-left">
                <h3 className="recipe-card-title">{t('view.stepsTitle')}</h3>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recipe.steps && recipe.steps.map((step, idx) => {
                const stepText = typeof step === 'object' && step !== null ? (step.text || step.title || '') : String(step || '')
                const stepIcon = (typeof step === 'object' && step !== null && step.icon) ? step.icon : detectStepActionIcon(stepText)
                const isCompleted = !!completedSteps[idx]

                return (
                  <div
                    key={idx}
                    className={`recipe-view-step-row ${isCompleted ? 'completed' : ''}`}
                    onClick={() => toggleStep(idx)}
                  >
                    <span className="recipe-view-step-num">{idx + 1}.</span>
                    {stepIcon && (
                      <div className="recipe-view-step-action-badge" title="Действие">
                        <RecipeIconImg icon={stepIcon} size={20} />
                      </div>
                    )}
                    <span className="recipe-view-step-text">{stepText}</span>
                    <div className="checkbox-custom" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      {isCompleted && <Check size={13} strokeWidth={3} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {showConfirmDelete && (
        <div className="modal-backdrop" onClick={() => setShowConfirmDelete(false)}>
          <div
            className="recipe-ing-popover"
            style={{ width: '320px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#f5eedc', fontSize: '1.05rem', marginBottom: '8px' }}>
              {t('view.deleteConfirmTitle')}
            </h3>
            <p style={{ color: '#a8927d', fontSize: '0.86rem', marginBottom: '16px', lineHeight: 1.4 }}>
              {t('view.deleteConfirmText')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowConfirmDelete(false)}
              >
                {t('view.cancel')}
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  onDelete(recipe.id)
                  setShowConfirmDelete(false)
                }}
              >
                {t('view.confirmDeleteBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
