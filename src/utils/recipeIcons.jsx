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

export function getAllRecipeIcons() {
  return Object.entries(iconsMap).map(([key, src]) => ({
    key,
    src,
    name: RECIPE_ICON_LABELS[key] || key
  }))
}

export function getActionIconsList() {
  return ACTION_ICONS_KEYS.map(key => ({
    key,
    src: iconsMap[key],
    name: RECIPE_ICON_LABELS[key] || key
  })).filter(item => Boolean(item.src))
}

export function detectStepActionIcon(text) {
  if (!text) return ''
  const t = text.toLowerCase()
  if (t.includes('нареж') || t.includes('пореж') || t.includes('измельч') || t.includes('очист') || t.includes('кубик') || t.includes('брусочк') || t.includes('ломтик') || t.includes('натри') || t.includes('шинку')) {
    return 'cutting_board'
  }
  if (t.includes('взби') || t.includes('взбей') || t.includes('венчик') || t.includes('эмульси')) {
    return 'whisk'
  }
  if (t.includes('перемеш') || t.includes('смеша') || t.includes('соедин') || t.includes('миск') || t.includes('емкост')) {
    return 'mixing_bowl'
  }
  if (t.includes('вар') || t.includes('кипя') || t.includes('бульон') || t.includes('отвар') || t.includes('кастрюл')) {
    return 'pot'
  }
  if (t.includes('обжар') || t.includes('подрумян') || t.includes('жарь') || t.includes('сковород') || t.includes('гриль')) {
    return 'skillet'
  }
  if (t.includes('выпек') || t.includes('запек') || t.includes('духовк') || t.includes('градус') || t.includes('форм')) {
    return 'bakeware'
  }
  if (t.includes('раскат') || t.includes('замес') || t.includes('тест')) {
    return 'wheat_dough'
  }
  if (t.includes('туш') || t.includes('соус') || t.includes('томл')) {
    return 'saucepan'
  }
  if (t.includes('выжм') || t.includes('отж') || t.includes('сок')) {
    return 'juicer'
  }
  return ''
}

export function detectRecipeIcon(title, category = '') {
  if (!title) return 'sweet_roll'
  const t = (title + ' ' + category).toLowerCase()
  if (t.includes('пирог') || t.includes('тарт')) return 'apple_pie'
  if (t.includes('суп') || t.includes('борщ') || t.includes('бульон') || t.includes('уха')) return 'beetroot_soup'
  if (t.includes('хлеб') || t.includes('багет') || t.includes('чиабатт') || t.includes('фокачч') || t.includes('брускетт')) return 'bread'
  if (t.includes('торт') || t.includes('чизкейк')) return 'sweet_berry_cheesecake'
  if (t.includes('десерт')) return 'cake'
  if (t.includes('стейк') || t.includes('говядин')) return 'cooked_beef'
  if (t.includes('куриц') || t.includes('цыплен')) return 'cooked_chicken'
  if (t.includes('рыб') || t.includes('лосос') || t.includes('семг') || t.includes('форел')) return 'cooked_salmon'
  if (t.includes('свинин') || t.includes('бекон') || t.includes('гуанчале') || t.includes('карбонар') || t.includes('паста')) return 'cooked_porkchop'
  if (t.includes('яйц') || t.includes('яичниц') || t.includes('омлет')) return 'fried_egg'
  if (t.includes('бургер') || t.includes('сэндвич') || t.includes('бутерброд')) return 'hamburger'
  if (t.includes('чай') || t.includes('напиток')) return 'builders_tea'
  if (t.includes('какао') || t.includes('шоколад')) return 'hot_cocoa'
  if (t.includes('ролл') || t.includes('суши')) return 'rice_roll_medley_block'
  if (t.includes('пельмен') || t.includes('вареник') || t.includes('дамплинг')) return 'dumplings'
  if (t.includes('печень')) return 'cookie'
  if (t.includes('булочк') || t.includes('оладь') || t.includes('панкейк') || t.includes('завтрак')) return 'sweet_roll'
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
