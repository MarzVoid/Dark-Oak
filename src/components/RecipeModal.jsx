import React, { useState } from 'react'
import {
  X,
  Heart,
  Clock,
  Users,
  Check,
  Edit3,
  Trash2,
  Minus,
  Plus,
  ListOrdered,
  ChefHat
} from 'lucide-react'
import { IngredientIcon } from '../utils/ingredientIcons'

export default function RecipeModal({
  recipe,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite
}) {
  const [checkedIngredients, setCheckedIngredients] = useState({})
  const [servingsMultiplier, setServingsMultiplier] = useState(recipe.servings || 2)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const baseServings = recipe.servings || 2
  const ratio = servingsMultiplier / baseServings

  const toggleCheck = (index) => {
    setCheckedIngredients(prev => ({
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
    if (!origAmount || isNaN(origAmount)) return ''
    const val = Number(origAmount) * ratio
    return Number.isInteger(val) ? val : val.toFixed(1)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hero">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="modal-hero-image"
            />
          ) : (
            <div style={{ height: '140px', background: '#100a06' }} />
          )}
          <div className="modal-hero-gradient" />

          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>

          <div className="modal-hero-content">
            <span className="modal-category-tag">{recipe.category}</span>
            <h2 className="modal-title">{recipe.title}</h2>
          </div>
        </div>

        <div className="modal-content-scroll">
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-value">{recipe.prepTime || 0} мин</span>
              <span className="stat-label">Подготовка</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">{recipe.cookTime || 0} мин</span>
              <span className="stat-label">Готовка</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">
                {(Number(recipe.prepTime) || 0) + (Number(recipe.cookTime) || 0)} мин
              </span>
              <span className="stat-label">Всего</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="servings-stepper">
                <button className="step-btn" onClick={handleMinusServings}>
                  <Minus size={12} />
                </button>
                <span className="stat-value">{servingsMultiplier}</span>
                <button className="step-btn" onClick={handlePlusServings}>
                  <Plus size={12} />
                </button>
              </div>
              <span className="stat-label">Порции</span>
            </div>
          </div>

          {recipe.description && (
            <p className="recipe-description-text">{recipe.description}</p>
          )}

          <div className="recipe-columns">
            <div>
              <h3 className="section-headline">
                <span>Ингредиенты</span>
              </h3>
              {(() => {
                const hasSections = recipe.ingredients && recipe.ingredients.some(i => i.section)
                if (!hasSections) {
                  return (
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
                              <IngredientIcon name={ing.name} icon={ing.icon} size={18} />
                              <span>{ing.name}</span>
                            </div>
                            <span className="ingredient-amount">
                              {formatAmount(ing.amount)} {ing.unit}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                }

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
                                  <IngredientIcon name={ing.name} icon={ing.icon} size={18} />
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
                                  <IngredientIcon name={ing.name} icon={ing.icon} size={18} />
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
              })()}
            </div>

            <div>
              <h3 className="section-headline">
                <ListOrdered size={18} color="var(--oak-300)" />
                <span>Шаги приготовления</span>
              </h3>
              <div className="steps-list">
                {recipe.steps && recipe.steps.map((step, idx) => (
                  <div key={idx} className="step-row">
                    <div className="step-index-badge">{idx + 1}</div>
                    <p className="step-text">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions-bar">
          <div className="actions-left">
            <button
              className={`btn-secondary ${recipe.isFavorite ? 'active' : ''}`}
              onClick={() => onToggleFavorite(recipe.id)}
            >
              <Heart
                size={16}
                fill={recipe.isFavorite ? 'var(--oak-400)' : 'none'}
                color={recipe.isFavorite ? 'var(--oak-400)' : 'currentColor'}
              />
              <span>{recipe.isFavorite ? 'В избранном' : 'В избранное'}</span>
            </button>
          </div>

          <div className="actions-right">
            <button className="btn-secondary" onClick={() => onEdit(recipe)}>
              <Edit3 size={15} />
              <span>Редактировать</span>
            </button>
            <button
              className="btn-danger"
              onClick={() => setShowConfirmDelete(true)}
            >
              <Trash2 size={15} />
              <span>Удалить</span>
            </button>
          </div>
        </div>
      </div>

      {showConfirmDelete && (
        <div className="modal-backdrop" style={{ zIndex: 110 }} onClick={() => setShowConfirmDelete(false)}>
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
                  Удалить рецепт?
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#a8a29e', lineHeight: 1.45 }}>
                  Рецепт «{recipe.title}» будет удален навсегда.
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
                onClick={() => setShowConfirmDelete(false)}
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
                  onDelete(recipe.id)
                  setShowConfirmDelete(false)
                }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
