const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

let SQL = null

async function getSql() {
  if (!SQL) {
    SQL = await initSqlJs()
  }
  return SQL
}

function initSchema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      prepTime INTEGER,
      cookTime INTEGER,
      servings INTEGER,
      rating REAL,
      isFavorite INTEGER,
      image TEXT,
      description TEXT,
      icon TEXT,
      ingredientSections TEXT,
      ingredients TEXT,
      steps TEXT,
      translations TEXT,
      data TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
  `)
}

async function loadDataFromDb(dbPath, jsonFallbackPath) {
  const SqlInstance = await getSql()
  let db = null

  try {
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath)
      if (fileBuffer && fileBuffer.length > 0) {
        db = new SqlInstance.Database(fileBuffer)
      }
    }

    if (!db) {
      db = new SqlInstance.Database()
      initSchema(db)

      if (jsonFallbackPath && fs.existsSync(jsonFallbackPath)) {
        try {
          const raw = fs.readFileSync(jsonFallbackPath, 'utf-8')
          const parsed = JSON.parse(raw)
          if (parsed) {
            saveDataToDbInternal(db, parsed)
            const exported = db.export()
            const dir = path.dirname(dbPath)
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true })
            }
            fs.writeFileSync(dbPath, Buffer.from(exported))
            return readDataFromDbInstance(db)
          }
        } catch (e) {}
      }
      return null
    }

    initSchema(db)
    const result = readDataFromDbInstance(db)

    if ((!result.recipes || result.recipes.length === 0) && jsonFallbackPath && fs.existsSync(jsonFallbackPath)) {
      try {
        const raw = fs.readFileSync(jsonFallbackPath, 'utf-8')
        const parsed = JSON.parse(raw)
        if (parsed && Array.isArray(parsed.recipes) && parsed.recipes.length > 0) {
          saveDataToDbInternal(db, parsed)
          const exported = db.export()
          fs.writeFileSync(dbPath, Buffer.from(exported))
          return readDataFromDbInstance(db)
        }
      } catch (e) {}
    }

    return result
  } finally {
    if (db) {
      try {
        db.close()
      } catch (e) {}
    }
  }
}

function readDataFromDbInstance(db) {
  const categories = []
  const catStmt = db.prepare('SELECT name FROM categories ORDER BY id ASC')
  while (catStmt.step()) {
    const row = catStmt.getAsObject()
    if (row.name) {
      categories.push(row.name)
    }
  }
  catStmt.free()

  const recipes = []
  const recStmt = db.prepare('SELECT * FROM recipes ORDER BY rowid ASC')
  while (recStmt.step()) {
    const row = recStmt.getAsObject()
    let extra = {}
    if (row.data) {
      try {
        extra = JSON.parse(row.data)
      } catch (e) {}
    }

    let ingredientSections = []
    if (row.ingredientSections) {
      try {
        ingredientSections = JSON.parse(row.ingredientSections)
      } catch (e) {}
    } else if (extra.ingredientSections) {
      ingredientSections = extra.ingredientSections
    }

    let ingredients = []
    if (row.ingredients) {
      try {
        ingredients = JSON.parse(row.ingredients)
      } catch (e) {}
    } else if (extra.ingredients) {
      ingredients = extra.ingredients
    }

    let steps = []
    if (row.steps) {
      try {
        steps = JSON.parse(row.steps)
      } catch (e) {}
    } else if (extra.steps) {
      steps = extra.steps
    }

    let translations = {}
    if (row.translations) {
      try {
        translations = JSON.parse(row.translations)
      } catch (e) {}
    } else if (extra.translations) {
      translations = extra.translations
    }

    recipes.push({
      ...extra,
      id: row.id,
      title: row.title,
      category: row.category || '',
      prepTime: Number(row.prepTime) || 0,
      cookTime: Number(row.cookTime) || 0,
      servings: Number(row.servings) || 1,
      rating: Number(row.rating) || 5,
      isFavorite: Boolean(row.isFavorite),
      image: row.image || '',
      description: row.description || '',
      icon: row.icon || '',
      ingredientSections,
      ingredients,
      steps,
      translations,
      createdAt: row.createdAt || extra.createdAt || '',
      updatedAt: row.updatedAt || extra.updatedAt || ''
    })
  }
  recStmt.free()

  return { recipes, categories }
}

function saveDataToDbInternal(db, data) {
  const recipes = Array.isArray(data.recipes) ? data.recipes : []
  const categories = Array.isArray(data.categories) ? data.categories : []

  db.run('BEGIN TRANSACTION;')
  db.run('DELETE FROM categories;')
  db.run('DELETE FROM recipes;')

  const catStmt = db.prepare('INSERT INTO categories (name) VALUES (?)')
  for (const cat of categories) {
    if (typeof cat === 'string' && cat.trim()) {
      catStmt.run([cat.trim()])
    }
  }
  catStmt.free()

  const recStmt = db.prepare(`
    INSERT INTO recipes (
      id, title, category, prepTime, cookTime, servings, rating,
      isFavorite, image, description, icon, ingredientSections,
      ingredients, steps, translations, data, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const r of recipes) {
    if (!r || !r.id || !r.title) continue

    const extra = { ...r }
    delete extra.id
    delete extra.title
    delete extra.category
    delete extra.prepTime
    delete extra.cookTime
    delete extra.servings
    delete extra.rating
    delete extra.isFavorite
    delete extra.image
    delete extra.description
    delete extra.icon
    delete extra.ingredientSections
    delete extra.ingredients
    delete extra.steps
    delete extra.translations
    delete extra.createdAt
    delete extra.updatedAt

    recStmt.run([
      String(r.id),
      String(r.title || ''),
      String(r.category || ''),
      Number(r.prepTime) || 0,
      Number(r.cookTime) || 0,
      Number(r.servings) || 1,
      Number(r.rating) || 5,
      r.isFavorite ? 1 : 0,
      String(r.image || ''),
      String(r.description || ''),
      String(r.icon || ''),
      JSON.stringify(r.ingredientSections || []),
      JSON.stringify(r.ingredients || []),
      JSON.stringify(r.steps || []),
      JSON.stringify(r.translations || {}),
      JSON.stringify(extra),
      String(r.createdAt || new Date().toISOString()),
      String(r.updatedAt || new Date().toISOString())
    ])
  }
  recStmt.free()

  db.run('COMMIT;')
}

async function saveDataToDb(dbPath, data, jsonSyncPath) {
  const SqlInstance = await getSql()
  let db = null

  try {
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath)
      if (fileBuffer && fileBuffer.length > 0) {
        db = new SqlInstance.Database(fileBuffer)
      }
    }

    if (!db) {
      db = new SqlInstance.Database()
    }

    initSchema(db)
    saveDataToDbInternal(db, data)

    const exported = db.export()
    fs.writeFileSync(dbPath, Buffer.from(exported))

    if (jsonSyncPath) {
      try {
        fs.writeFileSync(jsonSyncPath, JSON.stringify(data, null, 2), 'utf-8')
      } catch (e) {}
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  } finally {
    if (db) {
      try {
        db.close()
      } catch (e) {}
    }
  }
}

module.exports = {
  loadDataFromDb,
  saveDataToDb
}
