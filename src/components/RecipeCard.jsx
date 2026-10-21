import React from 'react'
import { Heart, Clock, Users, Star } from 'lucide-react'
import { RecipeIconImg, detectRecipeIcon } from '../utils/recipeIcons'
import { useI18n } from '../i18n/I18nContext'

export default function RecipeCard({ recipe, onSelect, onToggleFavorite }) {
  const { t, language } = useI18n()
  const totalTime = (Number(recipe.prepTime) || 0) + (Number(recipe.cookTime) || 0)

  const handleFavoriteClick = (e) => {
    e.stopPropagation()
    onToggleFavorite(recipe.id)
  }

  const renderStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={13}
          fill={i <= rating ? 'var(--accent-gold)' : 'none'}
          className={i <= rating ? '' : 'star-empty'}
        />
      )
    }
    return stars
  }

  const currentIcon = recipe.icon || detectRecipeIcon(recipe.title, recipe.category)

  return (
    <div
      className="recipe-card"
      onClick={() => onSelect(recipe)}
    >
      <div className="card-media">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="card-image"
            loading="lazy"
          />
        ) : (
          <div className="card-no-image">
            <RecipeIconImg
              icon={currentIcon}
              size={56}
            />
          </div>
        )}
        <div className="card-overlay-badge">
          {recipe.category}
        </div>
        <button
          className={`card-fav-btn ${recipe.isFavorite ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          title={recipe.isFavorite ? t('view.favoriteActive') : t('view.favoriteAdd')}
        >
          <Heart size={16} fill={recipe.isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="card-body">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentIcon && <RecipeIconImg icon={currentIcon} size={20} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {recipe.title}
          </span>
        </h3>

        <div className="card-meta">
          <div className="card-meta-item">
            <Clock size={13} />
            <span>{totalTime} {language === 'ru' ? 'мин' : 'min'}</span>
          </div>
          <div className="card-meta-item">
            <Users size={13} />
            <span>{recipe.servings} {t('card.servingsShort')}</span>
          </div>
        </div>

        <div className="card-footer">
          <div className="rating-stars">
            {renderStars(recipe.rating || 5)}
          </div>
        </div>
      </div>
    </div>
  )
}
