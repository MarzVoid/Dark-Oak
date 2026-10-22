import React, { useState, useRef } from 'react'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Star,
  Link as LinkIcon,
  GripVertical,
  FolderOpen,
  Image as ImageIcon,
  FolderPlus,
  Layers,
  X
} from 'lucide-react'
import {
  IngredientIcon,
  hasIngredientIcon,
  getAvailableCustomIcons
} from '../utils/ingredientIcons'
import {
  RecipeIconImg,
  getAllRecipeIcons,
  getActionIconsList,
  detectRecipeIcon,
  detectStepActionIcon
} from '../utils/recipeIcons'
import { useI18n } from '../i18n/I18nContext'

export default function RecipeEditorView({
  recipe,
  categories,
  onSave,
  onCancel
}) {
  const { t, language } = useI18n()
  const isEditing = !!recipe

  const [title, setTitle] = useState(recipe?.title || '')
  const [category, setCategory] = useState(recipe?.category || categories[0] || t('editor.defaultCategory'))
  const [prepTime, setPrepTime] = useState(recipe?.prepTime ?? 15)
  const [cookTime, setCookTime] = useState(recipe?.cookTime ?? 20)
  const [servings, setServings] = useState(recipe?.servings ?? 4)
  const [rating, setRating] = useState(recipe?.rating ?? 4)
  const [image, setImage] = useState(recipe?.image || '')
  const [description, setDescription] = useState(recipe?.description || '')
  const [recipeIcon, setRecipeIcon] = useState(recipe?.icon || '')
  const [isPickingRecipeIcon, setIsPickingRecipeIcon] = useState(false)
  const [pickingStepIconIndex, setPickingStepIconIndex] = useState(null)

  const [photoMode, setPhotoMode] = useState(() => {
    if (recipe?.image && recipe.image.startsWith('data:')) return 'file'
    return 'url'
  })
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setImage(event.target.result)
    }
    reader.readAsDataURL(file)
  }

  const [sections, setSections] = useState(() => {
    const list = []
    if (Array.isArray(recipe?.ingredientSections)) {
      recipe.ingredientSections.forEach(s => {
        if (s && !list.includes(s)) list.push(s)
      })
    }
    if (Array.isArray(recipe?.ingredients)) {
      recipe.ingredients.forEach(i => {
        if (i.section && !list.includes(i.section)) list.push(i.section)
      })
    }
    return list
  })
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')

  const handleAddSection = () => {
    const trimmed = newSectionName.trim()
    if (!trimmed) {
      setIsAddingSection(false)
      return
    }
    if (!sections.includes(trimmed)) {
      setSections(prev => [...prev, trimmed])
    }
    setNewSectionName('')
    setIsAddingSection(false)
  }

  const handleRemoveSection = (sectionName) => {
    setSections(prev => prev.filter(s => s !== sectionName))
    setIngredients(prev => prev.map(i => i.section === sectionName ? { ...i, section: '' } : i))
  }

  const [ingredients, setIngredients] = useState(() => {
    if (recipe?.ingredients && recipe.ingredients.length > 0) {
      return recipe.ingredients
    }
    return []
  })

  const [steps, setSteps] = useState(() => {
    if (recipe?.steps && recipe.steps.length > 0) {
      return recipe.steps.map(s => {
        if (typeof s === 'object' && s !== null) {
          const text = (s.title && s.text) ? `${s.title}: ${s.text}` : (s.text || s.title || '')
          return { text, icon: s.icon || '' }
        }
        return { text: String(s || ''), icon: '' }
      })
    }
    return [{ text: '', icon: '' }]
  })

  const availableCustomIcons = getAvailableCustomIcons(language)
  const allRecipeIcons = getAllRecipeIcons(language)
  const actionIconsList = getActionIconsList(language)
  const [activeIngEditor, setActiveIngEditor] = useState(null)

  const handleOpenAddIngredient = (targetSection = '') => {
    setActiveIngEditor({
      index: null,
      name: '',
      amount: '1',
      unit: t('editor.unitPcs'),
      icon: '',
      section: targetSection || (sections[0] || '')
    })
  }

  const handleOpenEditIngredient = (idx) => {
    setActiveIngEditor({
      index: idx,
      name: ingredients[idx].name,
      amount: ingredients[idx].amount,
      unit: ingredients[idx].unit,
      icon: ingredients[idx].icon || '',
      section: ingredients[idx].section || ''
    })
  }

  const handleSaveActiveIngredient = () => {
    if (!activeIngEditor || !activeIngEditor.name.trim()) {
      setActiveIngEditor(null)
      return
    }
    const itemData = {
      name: activeIngEditor.name.trim(),
      amount: activeIngEditor.amount.trim() || '1',
      unit: activeIngEditor.unit.trim() || t('editor.unitPcs')
    }
    if (activeIngEditor.icon) {
      itemData.icon = activeIngEditor.icon
    }
    if (activeIngEditor.section) {
      itemData.section = activeIngEditor.section
    }
    if (activeIngEditor.index !== null) {
      setIngredients(prev => {
        const copy = [...prev]
        copy[activeIngEditor.index] = itemData
        return copy
      })
    } else {
      setIngredients(prev => [...prev, itemData])
    }
    setActiveIngEditor(null)
  }

  const handleRemoveIngredient = (index) => {
    setIngredients(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddStep = () => {
    setSteps(prev => [...prev, { text: '', icon: '' }])
  }

  const handleUpdateStepText = (index, value) => {
    setSteps(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], text: value }
      return copy
    })
  }

  const handleUpdateStepIcon = (index, iconKey) => {
    setSteps(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], icon: iconKey }
      return copy
    })
  }

  const handleRemoveStep = (index) => {
    setSteps(prev => prev.filter((_, i) => i !== index))
  }

  const [draggedStepIndex, setDraggedStepIndex] = useState(null)
  const [dragOverStepIndex, setDragOverStepIndex] = useState(null)
  const [draggableIndex, setDraggableIndex] = useState(null)

  const handleStepDragStart = (e, index) => {
    setDraggedStepIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleStepDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverStepIndex !== index) {
      setDragOverStepIndex(index)
    }
  }

  const handleStepDrop = (e, targetIndex) => {
    e.preventDefault()
    if (draggedStepIndex === null || draggedStepIndex === targetIndex) {
      setDraggedStepIndex(null)
      setDragOverStepIndex(null)
      setDraggableIndex(null)
      return
    }

    setSteps(prev => {
      const copy = [...prev]
      const [moved] = copy.splice(draggedStepIndex, 1)
      copy.splice(targetIndex, 0, moved)
      return copy
    })

    setDraggedStepIndex(null)
    setDragOverStepIndex(null)
    setDraggableIndex(null)
  }

  const handleStepDragEnd = () => {
    setDraggedStepIndex(null)
    setDragOverStepIndex(null)
    setDraggableIndex(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      alert(t('editor.alertNoTitle'))
      return
    }

    const cleanedIngredients = ingredients.filter(i => i.name && i.name.trim() !== '')
    const cleanedSteps = steps
      .map(s => {
        const text = (typeof s === 'object' ? s.text : String(s || '')).trim()
        const icon = typeof s === 'object' ? (s.icon || '') : ''
        return { text, icon }
      })
      .filter(s => s.text !== '')

    const finalRecipe = {
      id: recipe?.id || `recipe-${Date.now()}`,
      title: title.trim(),
      icon: recipeIcon || detectRecipeIcon(title.trim(), category.trim()),
      category: category.trim() || t('editor.uncategorized'),
      prepTime: Number(prepTime) || 0,
      cookTime: Number(cookTime) || 0,
      servings: Number(servings) || 1,
      rating: Number(rating) || 5,
      isFavorite: recipe?.isFavorite || false,
      image: image.trim(),
      description: description.trim(),
      ingredientSections: sections,
      ingredients: cleanedIngredients,
      steps: cleanedSteps
    }

    onSave(finalRecipe)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <header className="top-bar">
        <div className="top-bar-left">
          <button type="button" className="btn-secondary" onClick={onCancel} title={t('view.back')}>
            <ArrowLeft size={16} />
            <span>{t('view.back')}</span>
          </button>
          <h1 className="current-view-title">{isEditing ? t('editor.editTitle') : t('editor.createTitle')}</h1>
        </div>

        <div className="top-bar-right">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {t('editor.cancelBtn')}
          </button>
          <button type="submit" form="recipe-editor-form" className="btn-primary">
            <Save size={16} />
            <span>{t('editor.saveBtn')}</span>
          </button>
        </div>
      </header>

      <div className="content-scrollable">
        <form
          id="recipe-editor-form"
          onSubmit={handleSubmit}
          className="recipe-editor-new-layout"
        >
          <div className="recipe-editor-top-row">
            <div className="recipe-editor-card recipe-editor-card-main">
              <div className="recipe-card-header">
                <div className="recipe-card-header-left">
                  <h3 className="recipe-card-title">{t('editor.mainInfo')}</h3>
                </div>
              </div>

              <div className="recipe-form-group">
                <label className="recipe-form-label">{t('editor.titleLabel')}</label>
                <div className="recipe-input-with-badge">
                  <button
                    type="button"
                    className="recipe-input-badge recipe-icon-badge-btn"
                    onClick={() => setIsPickingRecipeIcon(true)}
                    title={t('editor.selectIconTitle')}
                  >
                    <RecipeIconImg
                      icon={recipeIcon || detectRecipeIcon(title, category)}
                      size={24}
                    />
                  </button>
                  <div className="recipe-input-box" style={{ flex: 1 }}>
                    <input
                      type="text"
                      className="recipe-input-field"
                      placeholder={t('editor.titlePlaceholder')}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="recipe-form-group">
                <label className="recipe-form-label">{t('editor.categoryLabel')}</label>
                <select
                  className="recipe-select-field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="recipe-rating-row">
                <label className="recipe-form-label" style={{ margin: 0 }}>{t('editor.ratingLabel')}</label>
                <div className="recipe-stars-container">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className="recipe-star-btn"
                      onClick={() => setRating(star)}
                    >
                      <Star
                        size={18}
                        fill={star <= rating ? '#f5a623' : 'none'}
                        color={star <= rating ? '#f5a623' : 'rgba(255,255,255,0.2)'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="recipe-stats-grid">
                <div className="recipe-form-group" style={{ margin: 0 }}>
                  <label className="recipe-form-label">{t('editor.prepTimeLabel')}</label>
                  <div className="recipe-input-box">
                    <input
                      type="number"
                      min="0"
                      className="recipe-input-field"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="recipe-form-group" style={{ margin: 0 }}>
                  <label className="recipe-form-label">{t('editor.cookTimeLabel')}</label>
                  <div className="recipe-input-box">
                    <input
                      type="number"
                      min="0"
                      className="recipe-input-field"
                      value={cookTime}
                      onChange={(e) => setCookTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="recipe-form-group" style={{ margin: 0 }}>
                  <label className="recipe-form-label">{t('editor.servingsLabel')}</label>
                  <div className="recipe-input-box">
                    <input
                      type="number"
                      min="1"
                      className="recipe-input-field"
                      value={servings}
                      onChange={(e) => setServings(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="recipe-form-group">
                <label className="recipe-form-label">
                  {photoMode === 'url' ? t('editor.photoUrlLabel') : t('editor.photoFileLabel')}
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {photoMode === 'url' ? (
                    <div className="recipe-input-box" style={{ flex: 1 }}>
                      <LinkIcon size={16} color="#c4975a" />
                      <input
                        type="url"
                        className="recipe-input-field"
                        placeholder="https://..."
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div
                      className="recipe-input-box"
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon size={16} color="#c4975a" />
                      <span
                        style={{
                          fontSize: '0.85rem',
                          color: image ? '#f5eedc' : '#7a6857',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {image
                          ? (image.startsWith('data:') ? t('editor.fileSelected') : image)
                          : '...'}
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    className="recipe-photo-mode-btn"
                    onClick={() => setPhotoMode(prev => prev === 'url' ? 'file' : 'url')}
                    title={photoMode === 'url' ? t('editor.chooseFileTitle') : t('editor.enterUrlTitle')}
                  >
                    {photoMode === 'url' ? <FolderOpen size={16} /> : <LinkIcon size={16} />}
                  </button>
                </div>
              </div>

              <div className="recipe-form-group" style={{ margin: 0 }}>
                <label className="recipe-form-label">{t('editor.descLabel')}</label>
                <textarea
                  className="recipe-textarea-field"
                  rows={3}
                  placeholder={t('editor.descPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="recipe-editor-card recipe-editor-card-ingredients">
              <div className="recipe-card-header">
                <div className="recipe-card-header-left">
                  <h3 className="recipe-card-title">{t('editor.ingredientsTitle')}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="recipe-ref-btn-add"
                    onClick={() => setIsAddingSection(true)}
                    title={t('editor.createSectionTitle')}
                  >
                    <FolderPlus size={14} />
                    <span>{t('editor.addSectionBtn')}</span>
                  </button>
                  <button
                    type="button"
                    className="recipe-ref-btn-add"
                    onClick={() => handleOpenAddIngredient()}
                  >
                    <Plus size={14} />
                    <span>{t('editor.addIngredientBtn')}</span>
                  </button>
                </div>
              </div>

              {isAddingSection && (
                <div className="recipe-add-section-inline">
                  <input
                    type="text"
                    className="recipe-popover-input"
                    placeholder={t('editor.sectionPlaceholder')}
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddSection()
                      }
                      if (e.key === 'Escape') {
                        setIsAddingSection(false)
                        setNewSectionName('')
                      }
                    }}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="recipe-ref-btn-add"
                    onClick={handleAddSection}
                  >
                    {t('editor.addIngredientBtn')}
                  </button>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#a89a8c',
                      cursor: 'pointer',
                      padding: '4px 8px'
                    }}
                    onClick={() => {
                      setIsAddingSection(false)
                      setNewSectionName('')
                    }}
                  >
                    {t('editor.cancelBtn')}
                  </button>
                </div>
              )}

              {sections.length === 0 ? (
                <div className="recipe-ingredients-grid">
                  {ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="recipe-slot"
                      onClick={() => handleOpenEditIngredient(idx)}
                      title={`${ing.name} (${ing.amount} ${ing.unit})`}
                    >
                      <IngredientIcon name={ing.name} icon={ing.icon} />
                      <span className="recipe-slot-name">{ing.name || '...'}</span>
                      <span className="recipe-slot-count">
                        {ing.unit === 'шт' || ing.unit === 'pcs' ? `×${ing.amount}` : (ing.unit ? `${ing.amount} ${ing.unit}` : ing.amount)}
                      </span>
                      <button
                        type="button"
                        className="recipe-slot-remove"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveIngredient(idx)
                        }}
                        title={t('editor.delete')}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="recipe-sections-container">
                  {sections.map(sectionName => {
                    const sectionIngredients = ingredients
                      .map((ing, idx) => ({ ing, idx }))
                      .filter(item => item.ing.section === sectionName)

                    return (
                      <div key={sectionName} className="recipe-section-block">
                        <div className="recipe-section-block-header">
                          <span className="recipe-section-block-title">
                            <Layers size={14} color="#d49b65" />
                            {sectionName}
                          </span>
                          <div className="recipe-section-block-actions">
                            <button
                              type="button"
                              className="recipe-ref-btn-add"
                              style={{ padding: '3px 8px', fontSize: '0.76rem' }}
                              onClick={() => handleOpenAddIngredient(sectionName)}
                            >
                              <Plus size={12} />
                              <span>{t('editor.addIngredientBtn')}</span>
                            </button>
                            <button
                              type="button"
                              className="recipe-section-delete-btn"
                              onClick={() => handleRemoveSection(sectionName)}
                              title={t('editor.deleteSection')}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="recipe-ingredients-grid">
                          {sectionIngredients.map(({ ing, idx }) => (
                            <div
                              key={idx}
                              className="recipe-slot"
                              onClick={() => handleOpenEditIngredient(idx)}
                              title={`${ing.name} (${ing.amount} ${ing.unit})`}
                            >
                              <IngredientIcon name={ing.name} icon={ing.icon} />
                              <span className="recipe-slot-name">{ing.name || '...'}</span>
                              <span className="recipe-slot-count">
                                {ing.unit === 'шт' || ing.unit === 'pcs' ? `×${ing.amount}` : (ing.unit ? `${ing.amount} ${ing.unit}` : ing.amount)}
                              </span>
                              <button
                                type="button"
                                className="recipe-slot-remove"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveIngredient(idx)
                                }}
                                title={t('editor.delete')}
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}
                          {sectionIngredients.length === 0 && (
                            <div
                              className="recipe-slot recipe-slot-empty"
                              onClick={() => handleOpenAddIngredient(sectionName)}
                              style={{ cursor: 'pointer', borderStyle: 'dashed' }}
                              title={t('editor.addIngredient')}
                            >
                              <Plus size={16} />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {(() => {
                    const unsectioned = ingredients
                      .map((ing, idx) => ({ ing, idx }))
                      .filter(item => !item.ing.section || !sections.includes(item.ing.section))

                    if (unsectioned.length === 0) return null

                    return (
                      <div className="recipe-section-block">
                        <div className="recipe-section-block-header">
                          <span className="recipe-section-block-title" style={{ color: '#a8927d' }}>
                            {t('editor.otherSection')}
                          </span>
                        </div>
                        <div className="recipe-ingredients-grid">
                          {unsectioned.map(({ ing, idx }) => (
                            <div
                              key={idx}
                              className="recipe-slot"
                              onClick={() => handleOpenEditIngredient(idx)}
                              title={`${ing.name} (${ing.amount} ${ing.unit})`}
                            >
                              <IngredientIcon name={ing.name} icon={ing.icon} />
                              <span className="recipe-slot-name">{ing.name || '...'}</span>
                              <span className="recipe-slot-count">
                                {ing.unit === 'шт' || ing.unit === 'pcs' ? `×${ing.amount}` : (ing.unit ? `${ing.amount} ${ing.unit}` : ing.amount)}
                              </span>
                              <button
                                type="button"
                                className="recipe-slot-remove"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveIngredient(idx)
                                }}
                                title={t('editor.delete')}
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>

          <div className="recipe-editor-card recipe-editor-card-steps">
            <div className="recipe-card-header">
              <div className="recipe-card-header-left">
                <h3 className="recipe-card-title">{t('editor.stepsTitle')}</h3>
              </div>
              <button
                type="button"
                className="recipe-ref-btn-add"
                onClick={handleAddStep}
              >
                <Plus size={14} />
                <span>{t('editor.addStepBtn')}</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {steps.length === 0 ? (
                <div
                  onClick={handleAddStep}
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    border: '1px dashed rgba(212, 155, 101, 0.25)',
                    borderRadius: '6px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  {t('editor.emptySteps')}
                </div>
              ) : (
                steps.map((step, idx) => {
                  const stepText = typeof step === 'object' && step !== null ? step.text : String(step || '')
                  const stepIcon = typeof step === 'object' && step !== null ? step.icon : ''
                  const effectiveIcon = stepIcon || detectStepActionIcon(stepText)

                  return (
                    <div
                      key={idx}
                      className={`recipe-step-row ${draggedStepIndex === idx ? 'is-dragging' : ''} ${dragOverStepIndex === idx && draggedStepIndex !== idx ? 'drag-over' : ''}`}
                      draggable={draggableIndex === idx}
                      onDragStart={(e) => handleStepDragStart(e, idx)}
                      onDragOver={(e) => handleStepDragOver(e, idx)}
                      onDrop={(e) => handleStepDrop(e, idx)}
                      onDragEnd={handleStepDragEnd}
                    >
                      <span className="recipe-step-badge">{idx + 1}.</span>
                      <button
                        type="button"
                        className="recipe-step-icon-btn"
                        onClick={() => setPickingStepIconIndex(idx)}
                        title={t('editor.stepIconTitle')}
                      >
                        {effectiveIcon ? (
                          <RecipeIconImg icon={effectiveIcon} size={20} />
                        ) : (
                          <Plus size={13} color="#a8927d" />
                        )}
                      </button>
                      <input
                        type="text"
                        className="recipe-step-input"
                        value={stepText}
                        onChange={(e) => handleUpdateStepText(idx, e.target.value)}
                        placeholder={t('editor.stepPlaceholder')}
                      />
                      <div
                        className="recipe-step-drag-handle"
                        onMouseEnter={() => setDraggableIndex(idx)}
                        onMouseDown={() => setDraggableIndex(idx)}
                        onMouseLeave={() => {
                          if (draggedStepIndex === null) setDraggableIndex(null)
                        }}
                        title={t('editor.dragStepTitle')}
                      >
                        <GripVertical size={16} />
                      </div>
                      <button
                        type="button"
                        className="recipe-step-delete-btn"
                        onClick={() => handleRemoveStep(idx)}
                        title={t('editor.deleteStepTitle')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                }))
              }
            </div>
          </div>
        </form>
      </div>

      {activeIngEditor && (
        <div className="recipe-ing-popover-backdrop" onClick={() => setActiveIngEditor(null)}>
          <div className="recipe-ing-popover" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: 700, color: '#f5eedc', fontSize: '0.9rem' }}>
                {activeIngEditor.index !== null ? t('editor.editIngredient') : t('editor.newIngredient')}
              </span>
              <button
                type="button"
                onClick={() => setActiveIngEditor(null)}
                style={{ background: 'none', border: 'none', color: '#a89a8c', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
              >
                ✕
              </button>
            </div>

            <div className="recipe-popover-inputs-row">
              <input
                type="text"
                className="recipe-popover-input"
                style={{ flex: 1, minWidth: 0 }}
                value={activeIngEditor.name}
                onChange={(e) => setActiveIngEditor(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSaveActiveIngredient()
                  }
                }}
                autoFocus
              />
              <input
                type="text"
                className="recipe-popover-input"
                style={{ width: '64px', minWidth: '64px', textAlign: 'center' }}
                value={activeIngEditor.amount}
                onChange={(e) => setActiveIngEditor(prev => ({ ...prev, amount: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSaveActiveIngredient()
                  }
                }}
              />
              <input
                type="text"
                className="recipe-popover-input"
                style={{ width: '56px', minWidth: '56px', textAlign: 'center' }}
                value={activeIngEditor.unit}
                onChange={(e) => setActiveIngEditor(prev => ({ ...prev, unit: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSaveActiveIngredient()
                  }
                }}
              />
            </div>

            {hasIngredientIcon(activeIngEditor.name, activeIngEditor.icon) && (
              <div className="recipe-popover-icon-preview">
                <div className="recipe-popover-icon-box">
                  <IngredientIcon name={activeIngEditor.name} icon={activeIngEditor.icon} />
                </div>
                <span className="recipe-popover-icon-name">{activeIngEditor.name.trim()}</span>
              </div>
            )}

            {availableCustomIcons.length > 0 && (
              <div className="recipe-popover-custom-icons">
                <div className="recipe-popover-custom-icons-list">
                  {availableCustomIcons.map(item => (
                    <button
                      key={item.key}
                      type="button"
                      className={`recipe-popover-icon-choice ${activeIngEditor.icon === item.key ? 'active' : ''}`}
                      onClick={() => setActiveIngEditor(prev => ({
                        ...prev,
                        name: item.name,
                        icon: item.key
                      }))}
                      title={item.name}
                    >
                      <img src={item.src} alt={item.name} className="recipe-ingredient-image" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sections.length > 0 && (
              <div className="recipe-popover-section-row">
                <span className="recipe-popover-section-label">{t('editor.sectionLabel')}</span>
                <select
                  className="recipe-popover-section-select"
                  value={activeIngEditor.section || ''}
                  onChange={(e) => setActiveIngEditor(prev => ({ ...prev, section: e.target.value }))}
                >
                  <option value="">{t('editor.noSection')}</option>
                  {sections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {activeIngEditor.index !== null && (
                <button
                  type="button"
                  style={{
                    padding: '5px 12px',
                    background: 'rgba(255, 77, 77, 0.15)',
                    border: '1px solid rgba(255, 77, 77, 0.35)',
                    color: '#ff6b6b',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    handleRemoveIngredient(activeIngEditor.index)
                    setActiveIngEditor(null)
                  }}
                >
                  {t('editor.delete')}
                </button>
              )}
              <button
                type="button"
                className="recipe-ref-btn-add"
                onClick={handleSaveActiveIngredient}
              >
                {t('editor.doneBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPickingRecipeIcon && (
        <div className="modal-backdrop" onClick={() => setIsPickingRecipeIcon(false)}>
          <div
            className="recipe-icon-picker-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="recipe-card-header">
              <div className="recipe-card-header-left">
                <h3 className="recipe-card-title">{t('editor.dishIconTitle')}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setRecipeIcon('')
                    setIsPickingRecipeIcon(false)
                  }}
                  style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                >
                  {t('editor.autoSelect')}
                </button>
                <button
                  type="button"
                  className="recipe-step-delete-btn"
                  onClick={() => setIsPickingRecipeIcon(false)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="recipe-icon-picker-grid">
              {allRecipeIcons.map(item => (
                <button
                  key={item.key}
                  type="button"
                  className={`recipe-icon-picker-item ${recipeIcon === item.key ? 'active' : ''}`}
                  onClick={() => {
                    setRecipeIcon(item.key)
                    setIsPickingRecipeIcon(false)
                  }}
                  title={item.name}
                >
                  <img src={item.src} alt={item.name} className="pixel-art-icon" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                  <span className="recipe-icon-picker-name">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {pickingStepIconIndex !== null && (
        <div className="modal-backdrop" onClick={() => setPickingStepIconIndex(null)}>
          <div
            className="recipe-icon-picker-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="recipe-card-header">
              <div className="recipe-card-header-left">
                <h3 className="recipe-card-title">{t('editor.actionIconStepTitle', { step: pickingStepIconIndex + 1 })}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    handleUpdateStepIcon(pickingStepIconIndex, '')
                    setPickingStepIconIndex(null)
                  }}
                  style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                >
                  {t('editor.autoSelect')}
                </button>
                <button
                  type="button"
                  className="recipe-step-delete-btn"
                  onClick={() => setPickingStepIconIndex(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#a8927d', marginBottom: '8px', fontWeight: 600 }}>
              {t('editor.actionsAndTools')}
            </div>
            <div className="recipe-icon-picker-grid" style={{ marginBottom: '16px' }}>
              {actionIconsList.map(item => {
                const currentStepIcon = steps[pickingStepIconIndex]?.icon
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`recipe-icon-picker-item ${currentStepIcon === item.key ? 'active' : ''}`}
                    onClick={() => {
                      handleUpdateStepIcon(pickingStepIconIndex, item.key)
                      setPickingStepIconIndex(null)
                    }}
                    title={item.name}
                  >
                    <img src={item.src} alt={item.name} className="pixel-art-icon" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    <span className="recipe-icon-picker-name">{item.name}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ fontSize: '0.78rem', color: '#a8927d', marginBottom: '8px', fontWeight: 600 }}>
              {t('editor.allIcons')}
            </div>
            <div className="recipe-icon-picker-grid">
              {allRecipeIcons.map(item => {
                const currentStepIcon = steps[pickingStepIconIndex]?.icon
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`recipe-icon-picker-item ${currentStepIcon === item.key ? 'active' : ''}`}
                    onClick={() => {
                      handleUpdateStepIcon(pickingStepIconIndex, item.key)
                      setPickingStepIconIndex(null)
                    }}
                    title={item.name}
                  >
                    <img src={item.src} alt={item.name} className="pixel-art-icon" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    <span className="recipe-icon-picker-name">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
