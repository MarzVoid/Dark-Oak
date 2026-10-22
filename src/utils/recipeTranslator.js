const unitDictionary = {
  ru_to_en: {
    'г': 'g',
    'г.': 'g',
    'гр': 'g',
    'гр.': 'g',
    'грамм': 'g',
    'граммов': 'g',
    'кг': 'kg',
    'кг.': 'kg',
    'мл': 'ml',
    'мл.': 'ml',
    'миллилитров': 'ml',
    'л': 'l',
    'л.': 'l',
    'литр': 'l',
    'литров': 'l',
    'литра': 'l',
    'шт': 'pcs',
    'шт.': 'pcs',
    'штук': 'pcs',
    'штуки': 'pcs',
    'штука': 'pc',
    'ст. л.': 'tbsp',
    'ст.л.': 'tbsp',
    'столовая ложка': 'tbsp',
    'столовых ложек': 'tbsp',
    'столовые ложки': 'tbsp',
    'ч. л.': 'tsp',
    'ч.л.': 'tsp',
    'чайная ложка': 'tsp',
    'чайных ложек': 'tsp',
    'чайные ложки': 'tsp',
    'щепотка': 'pinch',
    'щепотки': 'pinches',
    'зубчик': 'clove',
    'зубчика': 'cloves',
    'зубчиков': 'cloves',
    'стакан': 'cup',
    'стакана': 'cups',
    'стаканов': 'cups',
    'пучок': 'bunch',
    'пучка': 'bunches',
    'по вкусу': 'to taste'
  },
  en_to_ru: {
    'g': 'г',
    'gr': 'г',
    'gram': 'г',
    'grams': 'г',
    'kg': 'кг',
    'ml': 'мл',
    'l': 'л',
    'liter': 'л',
    'liters': 'л',
    'pcs': 'шт',
    'pc': 'шт',
    'piece': 'шт',
    'pieces': 'шт',
    'tbsp': 'ст. л.',
    'tablespoon': 'ст. л.',
    'tablespoons': 'ст. л.',
    'tsp': 'ч. л.',
    'teaspoon': 'ч. л.',
    'teaspoons': 'ч. л.',
    'pinch': 'щепотка',
    'pinches': 'щепотки',
    'clove': 'зубчик',
    'cloves': 'зубчика',
    'cup': 'стакан',
    'cups': 'стакана',
    'bunch': 'пучок',
    'to taste': 'по вкусу'
  }
}

const categoryDictionary = {
  ru_to_en: {
    'Десерты': 'Desserts',
    'Паста': 'Pasta',
    'Завтраки': 'Breakfast',
    'Выпечка': 'Baking',
    'Супы': 'Soups',
    'Салаты': 'Salads',
    'Напитки': 'Drinks',
    'Закуски': 'Snacks',
    'Мясо': 'Meat',
    'Рыба': 'Fish',
    'Основные блюда': 'Main Courses'
  },
  en_to_ru: {
    'Desserts': 'Десерты',
    'Pasta': 'Паста',
    'Breakfast': 'Завтраки',
    'Baking': 'Выпечка',
    'Soups': 'Супы',
    'Salads': 'Салаты',
    'Drinks': 'Напитки',
    'Snacks': 'Закуски',
    'Meat': 'Мясо',
    'Fish': 'Рыба',
    'Main Courses': 'Основные блюда'
  }
}

export function hasCyrillic(str) {
  return /[а-яА-ЯёЁ]/.test(String(str || ''))
}

export function translateUnit(unit, targetLang) {
  if (!unit || typeof unit !== 'string') return ''
  const trimmed = unit.trim().toLowerCase()
  if (targetLang === 'en') {
    return unitDictionary.ru_to_en[trimmed] || unit
  } else {
    return unitDictionary.en_to_ru[trimmed] || unit
  }
}

export function translateCategory(cat, targetLang) {
  if (!cat || typeof cat !== 'string') return ''
  const trimmed = cat.trim()
  if (targetLang === 'en') {
    return categoryDictionary.ru_to_en[trimmed] || cat
  } else {
    return categoryDictionary.en_to_ru[trimmed] || cat
  }
}

export async function translateSingleText(text, targetLang) {
  if (!text || typeof text !== 'string' || !text.trim()) return text

  if (typeof window !== 'undefined' && window.cherryApi && typeof window.cherryApi.translateText === 'function') {
    try {
      const res = await window.cherryApi.translateText(text, targetLang)
      if (res && res.success && res.text) {
        return res.text
      }
    } catch (e) {}
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`
    const res = await fetch(url)
    if (!res.ok) return text
    const json = await res.json()
    if (Array.isArray(json) && Array.isArray(json[0])) {
      return json[0].map(item => item[0]).join('')
    }
  } catch (e) {}

  return text
}

export async function translateBatchTexts(texts, targetLang) {
  if (!Array.isArray(texts) || texts.length === 0) return []

  if (typeof window !== 'undefined' && window.cherryApi && typeof window.cherryApi.translateBatch === 'function') {
    try {
      const res = await window.cherryApi.translateBatch(texts, targetLang)
      if (res && res.success && Array.isArray(res.results)) {
        return res.results
      }
    } catch (e) {}
  }

  return Promise.all(texts.map(t => translateSingleText(t, targetLang)))
}

export async function translateRecipe(recipe, targetLang) {
  if (!recipe || !recipe.title) return recipe

  const currentTranslations = recipe.translations || {}
  if (currentTranslations[targetLang] && currentTranslations[targetLang].title) {
    return recipe
  }

  const recipeIsRu = hasCyrillic(recipe.title || recipe.description || '')
  if ((recipeIsRu && targetLang === 'ru') || (!recipeIsRu && targetLang === 'en')) {
    return recipe
  }

  const textsToTranslate = []
  const textKeys = []

  if (recipe.title) {
    textsToTranslate.push(recipe.title)
    textKeys.push({ type: 'title' })
  }

  if (recipe.description) {
    textsToTranslate.push(recipe.description)
    textKeys.push({ type: 'description' })
  }

  if (recipe.category && !categoryDictionary[targetLang === 'en' ? 'ru_to_en' : 'en_to_ru'][recipe.category.trim()]) {
    textsToTranslate.push(recipe.category)
    textKeys.push({ type: 'category' })
  }

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  ingredients.forEach((ing, index) => {
    if (ing && ing.name) {
      textsToTranslate.push(ing.name)
      textKeys.push({ type: 'ingredient_name', index })
    }
  })

  const steps = Array.isArray(recipe.steps) ? recipe.steps : []
  steps.forEach((step, index) => {
    const text = typeof step === 'object' ? (step.text || '') : String(step || '')
    if (text) {
      textsToTranslate.push(text)
      textKeys.push({ type: 'step_text', index })
    }
  })

  const translatedList = await translateBatchTexts(textsToTranslate, targetLang)

  let translatedTitle = recipe.title
  let translatedDescription = recipe.description || ''
  let translatedCategory = translateCategory(recipe.category, targetLang)
  const translatedIngredients = ingredients.map(ing => ({
    ...ing,
    unit: translateUnit(ing.unit, targetLang)
  }))
  const translatedSteps = steps.map(s => {
    if (typeof s === 'object') {
      return { ...s }
    }
    return s
  })

  textKeys.forEach((keyInfo, i) => {
    const resultText = translatedList[i] || textsToTranslate[i]
    if (keyInfo.type === 'title') {
      translatedTitle = resultText
    } else if (keyInfo.type === 'description') {
      translatedDescription = resultText
    } else if (keyInfo.type === 'category') {
      translatedCategory = resultText
    } else if (keyInfo.type === 'ingredient_name') {
      if (translatedIngredients[keyInfo.index]) {
        translatedIngredients[keyInfo.index].name = resultText
      }
    } else if (keyInfo.type === 'step_text') {
      if (typeof translatedSteps[keyInfo.index] === 'object') {
        translatedSteps[keyInfo.index].text = resultText
      } else {
        translatedSteps[keyInfo.index] = resultText
      }
    }
  })

  const newTranslation = {
    title: translatedTitle,
    description: translatedDescription,
    category: translatedCategory,
    ingredients: translatedIngredients,
    steps: translatedSteps
  }

  return {
    ...recipe,
    translations: {
      ...currentTranslations,
      [targetLang]: newTranslation
    }
  }
}

export function getLocalizedRecipe(recipe, language) {
  if (!recipe) return recipe

  const targetLang = language || 'ru'
  const isRussianRecipe = hasCyrillic(recipe.title || recipe.description || '')

  if (targetLang === 'ru') {
    if (isRussianRecipe) {
      return recipe
    }
    if (recipe.translations && recipe.translations.ru) {
      return {
        ...recipe,
        ...recipe.translations.ru,
        _isTranslated: true
      }
    }
    return recipe
  }

  if (targetLang === 'en') {
    if (!isRussianRecipe) {
      return recipe
    }
    if (recipe.translations && recipe.translations.en) {
      return {
        ...recipe,
        ...recipe.translations.en,
        _isTranslated: true
      }
    }
    return recipe
  }

  return recipe
}
