import React from 'react'

const rawIcons = import.meta.glob('../assets/ingredients/*.{png,PNG,jpg,jpeg,svg,webp}', {
  eager: true,
  import: 'default'
})

const customImageMap = {}
for (const path in rawIcons) {
  const fileName = path.split('/').pop().replace(/\.[^/.]+$/, '').toLowerCase()
  customImageMap[fileName] = rawIcons[path]
}

const ICON_LABELS = {
  apple: 'Яблоко',
  avocado: 'Авокадо',
  bar_of_chocolate: 'Шоколад',
  beef: 'Говядина',
  black_pepper: 'Черный перец',
  blackberry: 'Ежевика',
  blueberry: 'Голубика',
  butter: 'Сливочное масло',
  cabbage_leaf: 'Лист капусты',
  cabbage: 'Капуста',
  candleberry: 'Восковница',
  carrot: 'Морковь',
  cheese: 'Сыр',
  cherry: 'Вишня',
  chicken_cuts: 'Кусочки курицы',
  chicken: 'Курица',
  cod: 'Треска',
  cooked_rice: 'Вареный рис',
  cranberry: 'Клюква',
  dough: 'Тесто',
  egg: 'Яйцо',
  elderberry: 'Бузина',
  garlic: 'Чеснок',
  glow_berries: 'Светящиеся ягоды',
  gooseberry: 'Крыжовник',
  grape: 'Виноград',
  greengrape: 'Зеленый виноград',
  honey_bottle: 'Мёд',
  huckleberry: 'Черника',
  juniperberry: 'Можжевельник',
  milk_bottle: 'Молоко',
  mulberry: 'Шелковица',
  mutton: 'Баранина',
  olive_oil: 'Оливковое масло',
  onion: 'Лук',
  peach: 'Персик',
  porkchop: 'Свинина',
  potato: 'Картофель',
  rabbit: 'Кролик',
  raspberry: 'Малина',
  rice: 'Рис',
  salmon_slice: 'Ломтик лосося',
  salmon: 'Лосось',
  salt: 'Соль',
  strawberry: 'Клубника',
  sweet_berries: 'Сладкие ягоды',
  toast: 'Хлеб',
  tomato: 'Томат',
  wheat_flour: 'Мука'
}

const ICON_LABELS_EN = {
  apple: 'Apple',
  avocado: 'Avocado',
  bar_of_chocolate: 'Chocolate',
  beef: 'Beef',
  black_pepper: 'Black Pepper',
  blackberry: 'Blackberry',
  blueberry: 'Blueberry',
  butter: 'Butter',
  cabbage_leaf: 'Cabbage Leaf',
  cabbage: 'Cabbage',
  candleberry: 'Candleberry',
  carrot: 'Carrot',
  cheese: 'Cheese',
  cherry: 'Cherry',
  chicken_cuts: 'Chicken Cuts',
  chicken: 'Chicken',
  cod: 'Cod',
  cooked_rice: 'Cooked Rice',
  cranberry: 'Cranberry',
  dough: 'Dough',
  egg: 'Egg',
  elderberry: 'Elderberry',
  garlic: 'Garlic',
  glow_berries: 'Glow Berries',
  gooseberry: 'Gooseberry',
  grape: 'Grape',
  greengrape: 'Green Grape',
  honey_bottle: 'Honey',
  huckleberry: 'Huckleberry',
  juniperberry: 'Juniper Berry',
  milk_bottle: 'Milk',
  mulberry: 'Mulberry',
  mutton: 'Mutton',
  olive_oil: 'Olive Oil',
  onion: 'Onion',
  peach: 'Peach',
  porkchop: 'Porkchop',
  potato: 'Potato',
  rabbit: 'Rabbit',
  raspberry: 'Raspberry',
  rice: 'Rice',
  salmon_slice: 'Salmon Slice',
  salmon: 'Salmon',
  salt: 'Salt',
  strawberry: 'Strawberry',
  sweet_berries: 'Sweet Berries',
  toast: 'Bread / Toast',
  tomato: 'Tomato',
  wheat_flour: 'Flour'
}

const ALIASES = {
  egg: ['яйц', 'яичн', 'желт', 'белок', 'egg', 'yolk'],
  butter: ['сливочное масл', 'масло сливочн', 'топленое масл', 'растопленное масл', 'butter'],
  olive_oil: ['оливковое масл', 'масло оливков', 'растительное масл', 'подсолнечное масл', 'olive oil', 'oil'],
  salt: ['соль', 'морская соль', 'соли', 'посолить', 'salt'],
  garlic: ['чеснок', 'чесночн', 'зубчик чеснок', 'зубчика чеснок', 'зубчиков чеснок', 'garlic'],
  cheese: ['сыр', 'пармезан', 'пекорино', 'моцарелл', 'чеддер', 'сулугуни', 'cheese'],
  black_pepper: ['черный перец', 'чёрный перец', 'свежемолотый перец', 'молотый перец', 'black pepper', 'pepper'],
  toast: ['чиабатт', 'багет', 'тост', 'хлеб', 'батон', 'сухарик', 'toast', 'bread'],
  chicken_cuts: ['кусочки куриц', 'нарезанная куриц', 'куриные кусочки', 'chicken cuts', 'chicken cut'],
  chicken: ['куриц', 'курятин', 'цыпленок', 'курочк', 'куриное филе', 'куриное мяс', 'куриная грудк', 'куриные бедр', 'куриные крыл', 'куриная', 'chicken', 'poultry'],
  salmon_slice: ['филе лосос', 'ломтик лосос', 'кусочек лосос', 'кусочки лосос', 'лососевое филе', 'salmon slice'],
  cabbage_leaf: ['лист капуст', 'капустный лист', 'листья капуст', 'cabbage leaf'],
  cooked_rice: ['вареный рис', 'отварной рис', 'каша рис', 'чаша рис', 'cooked rice'],
  greengrape: ['зеленый виноград', 'белый виноград', 'зелёный виноград', 'greengrape', 'green grape'],
  apple: ['яблок', 'apple'],
  avocado: ['авокадо', 'avocado'],
  bar_of_chocolate: ['шоколад', 'какао', 'плитк', 'шоколадн', 'chocolate', 'choc', 'cocoa'],
  beef: ['говядин', 'стейк', 'сырая говядин', 'говяж', 'beef'],
  blackberry: ['ежевик', 'blackberry'],
  blueberry: ['голубик', 'голубика', 'blueberry'],
  cabbage: ['капуст', 'кочан', 'cabbage'],
  candleberry: ['восковниц', 'candleberry'],
  carrot: ['морков', 'carrot'],
  cherry: ['вишн', 'черешн', 'cherry'],
  cod: ['треск', 'белая рыб', 'cod'],
  cranberry: ['клюкв', 'брусник', 'cranberry', 'lingonberry'],
  dough: ['тест', 'песочное тест', 'дрожжевое тест', 'слоеное тест', 'dough', 'batter'],
  elderberry: ['бузин', 'elderberry'],
  glow_berries: ['светящ', 'светящиеся ягод', 'glow berr', 'glowberry'],
  gooseberry: ['крыжовник', 'gooseberry'],
  grape: ['виноград', 'темный виноград', 'черный виноград', 'grape'],
  honey_bottle: ['мед', 'мёд', 'медов', 'honey'],
  huckleberry: ['черник', 'черника', 'гекльберри', 'huckleberry'],
  juniperberry: ['можжевель', 'можжевельник', 'ягоды можжевельника', 'juniper', 'juniperberry'],
  milk_bottle: ['молок', 'сливки', 'сливок', 'молочн', 'milk', 'cream'],
  mulberry: ['шелковиц', 'тутовник', 'шелковица', 'mulberry'],
  mutton: ['баранин', 'ягненок', 'mutton', 'lamb'],
  onion: ['лук', 'порей', 'шалот', 'репчат', 'onion', 'leek'],
  peach: ['персик', 'peach'],
  porkchop: ['свинин', 'бекон', 'ветчин', 'грудинк', 'панчетт', 'гуанчале', 'отбивн', 'корейк', 'свиной', 'pork', 'bacon', 'porkchop', 'ham'],
  potato: ['картоф', 'картош', 'potato'],
  rabbit: ['кролик', 'крольчатин', 'rabbit', 'hare'],
  raspberry: ['малин', 'малина', 'raspberry'],
  rice: ['рис', 'зерна рис', 'крупа рис', 'рисовая', 'rice'],
  salmon: ['лосос', 'семг', 'форел', 'красная рыб', 'salmon', 'trout'],
  strawberry: ['клубник', 'земляник', 'strawberry'],
  sweet_berries: ['сладкие ягод', 'ягод', 'sweet berr', 'berry', 'berries'],
  tomato: ['томат', 'помидор', 'помидорк', 'томатн', 'tomato'],
  wheat_flour: ['мук', 'пшениц', 'зерн', 'flour', 'wheat']
}

export function getAvailableCustomIcons(lang = 'ru') {
  const labels = lang === 'en' ? ICON_LABELS_EN : ICON_LABELS
  return Object.entries(customImageMap).map(([key, src]) => ({
    key,
    src,
    name: labels[key] || ICON_LABELS[key] || key
  }))
}

export function resolveCustomIcon(name, customKey) {
  if (customKey && customImageMap[customKey.toLowerCase()]) {
    return {
      type: 'image',
      src: customImageMap[customKey.toLowerCase()],
      key: customKey.toLowerCase()
    }
  }

  const n = (name || '').toLowerCase().trim()
  if (!n) return null

  if (customImageMap[n]) {
    return { type: 'image', src: customImageMap[n], key: n }
  }

  for (const [aliasKey, list] of Object.entries(ALIASES)) {
    if (list.some(item => n.includes(item))) {
      if (customImageMap[aliasKey]) {
        return { type: 'image', src: customImageMap[aliasKey], key: aliasKey }
      }
    }
  }

  for (const [key, src] of Object.entries(customImageMap)) {
    if (n.includes(key) || key.includes(n)) {
      return { type: 'image', src, key }
    }
  }

  return null
}

export function hasIngredientIcon(name, customKey) {
  return !!resolveCustomIcon(name, customKey)
}

export function IngredientIcon({ name, icon, size = 26 }) {
  const custom = resolveCustomIcon(name, icon)
  if (custom) {
    return (
      <img
        src={custom.src}
        alt={name || ''}
        className="recipe-ingredient-image"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2L10 6L14 8L10 10L8 14L6 10L2 8L6 6L8 2Z" fill="#d49b65" stroke="#8c582f" strokeWidth="1" />
    </svg>
  )
}
