import React from 'react'

const rawIcons = import.meta.glob('../assets/icons/*.{png,PNG,jpg,jpeg,svg,webp}', {
  eager: true,
  import: 'default'
})

const iconsMap = {}
for (const path in rawIcons) {
  const fileName = path.split('/').pop().replace(/\.[^/.]+$/, '').toLowerCase()
  iconsMap[fileName] = rawIcons[path]
}

export const RECIPE_ICON_LABELS = {
  apple_pie: 'Яблочный пирог',
  bakeware: 'Запекание (форма)',
  beetroot_soup: 'Свекольный суп',
  bread: 'Хлеб',
  builders_tea: 'Чай',
  cake: 'Торт',
  chocolate_pie: 'Шоколадный пирог',
  cooked_beef: 'Стейк',
  cooked_chicken: 'Жареная курица',
  cooked_chicken_cuts: 'Куриные кусочки',
  cooked_cod: 'Жареная треска',
  cooked_mutton: 'Жареная баранина',
  cooked_mutton_chops: 'Бараньи отбивные',
  cooked_porkchop: 'Жареная свинина',
  cooked_rabbit: 'Жареный кролик',
  cooked_salmon: 'Жареный лосось',
  cookie: 'Печенье',
  cutting_board: 'Нарезка (доска)',
  dumplings: 'Пельмени / Вареники',
  fried_egg: 'Яичница',
  hamburger: 'Бургер',
  honeycomb: 'Мёд / Соты',
  hot_cocoa: 'Горячее какао',
  juicer: 'Отжим сока',
  kelp_roll: 'Роллы',
  kelp_roll_slice: 'Суши',
  minced_beef: 'Фарш / рубка',
  mixing_bowl: 'Смешивание (миска)',
  mutton_chops: 'Разделка мяса',
  pot: 'Варка (кастрюля)',
  pumpkin_pie: 'Тыквенный пирог',
  rabbit_stew: 'Рагу',
  rice_roll_medley_block: 'Сет роллов',
  saucepan: 'Тушение (сотейник)',
  skillet: 'Жарка (сковорода)',
  sweet_berry_cheesecake: 'Чизкейк',
  sweet_roll: 'Булочка',
  wheat_dough: 'Замес теста',
  whisk: 'Взбивание (венчик)'
}

export const RECIPE_ICON_LABELS_EN = {
  apple_pie: 'Apple Pie',
  bakeware: 'Baking Dish',
  beetroot_soup: 'Beetroot Soup',
  bread: 'Bread',
  builders_tea: 'Tea',
  cake: 'Cake',
  chocolate_pie: 'Chocolate Pie',
  cooked_beef: 'Steak',
  cooked_chicken: 'Fried Chicken',
  cooked_chicken_cuts: 'Chicken Cuts',
  cooked_cod: 'Cooked Cod',
  cooked_mutton: 'Roast Mutton',
  cooked_mutton_chops: 'Mutton Chops',
  cooked_porkchop: 'Roast Pork',
  cooked_rabbit: 'Cooked Rabbit',
  cooked_salmon: 'Cooked Salmon',
  cookie: 'Cookie',
  cutting_board: 'Cutting Board',
  dumplings: 'Dumplings',
  fried_egg: 'Fried Egg',
  hamburger: 'Burger',
  honeycomb: 'Honey / Comb',
  hot_cocoa: 'Hot Cocoa',
  juicer: 'Juicer',
  kelp_roll: 'Rolls',
  kelp_roll_slice: 'Sushi',
  minced_beef: 'Minced Meat',
  mixing_bowl: 'Mixing Bowl',
  mutton_chops: 'Meat Cuts',
  pot: 'Cooking Pot',
  pumpkin_pie: 'Pumpkin Pie',
  rabbit_stew: 'Stew',
  rice_roll_medley_block: 'Roll Set',
  saucepan: 'Saucepan',
  skillet: 'Skillet',
  sweet_berry_cheesecake: 'Cheesecake',
  sweet_roll: 'Sweet Roll',
  wheat_dough: 'Knead Dough',
  whisk: 'Whisk'
}

export const ACTION_ICONS_KEYS = [
  'cutting_board',
  'whisk',
  'skillet',
  'pot',
  'bakeware',
  'mixing_bowl',
  'saucepan',
  'wheat_dough',
  'juicer',
  'minced_beef',
  'mutton_chops',
  'fried_egg'
]

export function getRecipeIconUrl(key) {
  if (!key) return null
  return iconsMap[key.toLowerCase()] || null
}

export function getAllRecipeIcons(lang = 'ru') {
  const labels = lang === 'en' ? RECIPE_ICON_LABELS_EN : RECIPE_ICON_LABELS
  return Object.entries(iconsMap).map(([key, src]) => ({
    key,
    src,
    name: labels[key] || RECIPE_ICON_LABELS[key] || key
  }))
}

export function getActionIconsList(lang = 'ru') {
  const labels = lang === 'en' ? RECIPE_ICON_LABELS_EN : RECIPE_ICON_LABELS
  return ACTION_ICONS_KEYS.map(key => ({
    key,
    src: iconsMap[key],
    name: labels[key] || RECIPE_ICON_LABELS[key] || key
  })).filter(item => Boolean(item.src))
}

export function detectStepActionIcon(text) {
  if (!text) return ''
  const t = text.toLowerCase()
  if (t.includes('нареж') || t.includes('пореж') || t.includes('измельч') || t.includes('очист') || t.includes('кубик') || t.includes('брусочк') || t.includes('ломтик') || t.includes('натри') || t.includes('шинку') || t.includes('chop') || t.includes('cut') || t.includes('slice') || t.includes('dice') || t.includes('grate') || t.includes('peel')) {
    return 'cutting_board'
  }
  if (t.includes('взби') || t.includes('взбей') || t.includes('венчик') || t.includes('эмульси') || t.includes('whisk') || t.includes('beat') || t.includes('whip')) {
    return 'whisk'
  }
  if (t.includes('перемеш') || t.includes('смеша') || t.includes('соедин') || t.includes('миск') || t.includes('емкост') || t.includes('mix') || t.includes('stir') || t.includes('combine') || t.includes('blend')) {
    return 'mixing_bowl'
  }
  if (t.includes('вар') || t.includes('кипя') || t.includes('бульон') || t.includes('отвар') || t.includes('кастрюл') || t.includes('boil') || t.includes('simmer') || t.includes('cook') || t.includes('pot')) {
    return 'pot'
  }
  if (t.includes('обжар') || t.includes('подрумян') || t.includes('жарь') || t.includes('сковород') || t.includes('гриль') || t.includes('fry') || t.includes('sear') || t.includes('sauté') || t.includes('pan') || t.includes('skillet')) {
    return 'skillet'
  }
  if (t.includes('выпек') || t.includes('запек') || t.includes('духовк') || t.includes('градус') || t.includes('форм') || t.includes('bake') || t.includes('roast') || t.includes('oven')) {
    return 'bakeware'
  }
  if (t.includes('раскат') || t.includes('замес') || t.includes('тест') || t.includes('knead') || t.includes('dough') || t.includes('roll')) {
    return 'wheat_dough'
  }
  if (t.includes('туш') || t.includes('соус') || t.includes('томл') || t.includes('stew') || t.includes('sauce') || t.includes('braise')) {
    return 'saucepan'
  }
  if (t.includes('выжм') || t.includes('отж') || t.includes('сок') || t.includes('juice') || t.includes('squeeze')) {
    return 'juicer'
  }
  return ''
}

export function detectRecipeIcon(title, category = '') {
  if (!title) return 'sweet_roll'
  const t = (title + ' ' + category).toLowerCase()
  if (t.includes('пирог') || t.includes('тарт') || t.includes('pie') || t.includes('tart')) return 'apple_pie'
  if (t.includes('суп') || t.includes('борщ') || t.includes('бульон') || t.includes('уха') || t.includes('soup') || t.includes('broth')) return 'beetroot_soup'
  if (t.includes('хлеб') || t.includes('багет') || t.includes('чиабатт') || t.includes('фокачч') || t.includes('брускетт') || t.includes('bread') || t.includes('toast') || t.includes('baguette')) return 'bread'
  if (t.includes('торт') || t.includes('чизкейк') || t.includes('cheesecake')) return 'sweet_berry_cheesecake'
  if (t.includes('десерт') || t.includes('dessert') || t.includes('cake')) return 'cake'
  if (t.includes('стейк') || t.includes('говядин') || t.includes('steak') || t.includes('beef')) return 'cooked_beef'
  if (t.includes('куриц') || t.includes('цыплен') || t.includes('chicken')) return 'cooked_chicken'
  if (t.includes('рыб') || t.includes('лосос') || t.includes('семг') || t.includes('форел') || t.includes('fish') || t.includes('salmon') || t.includes('trout') || t.includes('seafood')) return 'cooked_salmon'
  if (t.includes('свинин') || t.includes('бекон') || t.includes('гуанчале') || t.includes('карбонар') || t.includes('паста') || t.includes('pork') || t.includes('bacon') || t.includes('pasta')) return 'cooked_porkchop'
  if (t.includes('яйц') || t.includes('яичниц') || t.includes('омлет') || t.includes('egg') || t.includes('omelet')) return 'fried_egg'
  if (t.includes('бургер') || t.includes('сэндвич') || t.includes('бутерброд') || t.includes('burger') || t.includes('sandwich')) return 'hamburger'
  if (t.includes('чай') || t.includes('напиток') || t.includes('tea') || t.includes('drink')) return 'builders_tea'
  if (t.includes('какао') || t.includes('шоколад') || t.includes('cocoa') || t.includes('chocolate')) return 'hot_cocoa'
  if (t.includes('ролл') || t.includes('суши') || t.includes('roll') || t.includes('sushi')) return 'rice_roll_medley_block'
  if (t.includes('пельмен') || t.includes('вареник') || t.includes('дамплинг') || t.includes('dumpling')) return 'dumplings'
  if (t.includes('печень') || t.includes('cookie') || t.includes('biscuit')) return 'cookie'
  if (t.includes('булочк') || t.includes('оладь') || t.includes('панкейк') || t.includes('завтрак') || t.includes('pancake') || t.includes('breakfast') || t.includes('bun')) return 'sweet_roll'
  return 'cake'
}

export function RecipeIconImg({ icon, size = 24, className = '', style = {} }) {
  const src = getRecipeIconUrl(icon)
  if (!src) return null
  return (
    <img
      src={src}
      alt={icon}
      className={`pixel-art-icon ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        imageRendering: 'pixelated',
        flexShrink: 0,
        ...style
      }}
    />
  )
}
