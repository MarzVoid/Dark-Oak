import axios from 'axios'
import { execSync } from 'node:child_process'

const repo = process.env.REPO || 'MarzVoid/Dark-Oak'
const token = process.argv[2] || process.env.GITHUB_TOKEN
const wipeAllCode = process.argv.includes('--empty') || process.env.WIPE_CODE === 'true'

if (!token) {
  console.error('Ошибка: не указан токен GitHub.')
  console.log('Использование:')
  console.log('  node scripts/clean-github.mjs <твой_github_token>')
  console.log('или для полной очистки репозитория до пустого состояния:')
  console.log('  node scripts/clean-github.mjs <твой_github_token> --empty')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'DarkOak-Cleaner'
}

async function run() {
  console.log(`Запуск очистки репозитория ${repo}...`)

  try {
    console.log('1. Удаление релизов на GitHub...')
    try {
      const relRes = await axios.get(`https://api.github.com/repos/${repo}/releases`, { headers })
      const releases = relRes.data || []
      console.log(`Найдено релизов: ${releases.length}`)

      for (const rel of releases) {
        console.log(`Удаление релиза: ${rel.tag_name} (id: ${rel.id})...`)
        await axios.delete(`https://api.github.com/repos/${repo}/releases/${rel.id}`, { headers })
      }
    } catch (e) {
      console.log('Релизы уже очищены или не найдены.')
    }

    console.log('2. Удаление тегов на GitHub через API...')
    try {
      const tagsRes = await axios.get(`https://api.github.com/repos/${repo}/git/matching-refs/tags`, { headers })
      const tags = tagsRes.data || []
      console.log(`Найдено тегов на GitHub: ${tags.length}`)

      for (const tagObj of tags) {
        const refName = tagObj.ref.replace('refs/', '')
        console.log(`Удаление удаленного тега refs/${refName}...`)
        try {
          await axios.delete(`https://api.github.com/repos/${repo}/git/refs/${refName}`, { headers })
          console.log(`Тег ${refName} успешно удален на GitHub.`)
        } catch (errTag) {
          console.log(`Не удалось удалить тег ${refName} через API: ${errTag.message}`)
        }
      }
    } catch (e) {
      console.log('Ошибка при получении тегов через API:', e.message)
    }

    console.log('3. Удаление тегов локально и принудительно через Git push...')
    const pushUrl = `https://${token}@github.com/${repo}.git`
    let localTags = []
    try {
      const out = execSync('git tag -l', { encoding: 'utf8' })
      localTags = out.split(/\r?\n/).map(t => t.trim()).filter(Boolean)
    } catch (e) {
    }

    if (localTags.length > 0) {
      console.log(`Локальные теги для удаления: ${localTags.join(', ')}`)
      for (const tag of localTags) {
        try {
          execSync(`git push ${pushUrl} --delete ${tag}`, { stdio: 'ignore' })
          console.log(`Тег ${tag} удален на GitHub через git push.`)
        } catch (e) {
        }
        try {
          execSync(`git tag -d ${tag}`, { stdio: 'ignore' })
        } catch (e) {
        }
      }
    }

    console.log('4. Очистка кода на GitHub...')
    if (wipeAllCode) {
      console.log('Режим --empty: создание пустой ветки main...')
      execSync('git checkout --orphan empty-clean-branch', { stdio: 'inherit' })
      execSync('git rm -rf .', { stdio: 'inherit' })
      execSync('git commit --allow-empty -m "Initial empty repository"', { stdio: 'inherit' })
      execSync(`git push ${pushUrl} empty-clean-branch:main --force`, { stdio: 'inherit' })
      execSync('git checkout main', { stdio: 'inherit' })
      execSync('git branch -D empty-clean-branch', { stdio: 'ignore' })
      console.log('Код на GitHub очищен до пустого состояния!')
    } else {
      console.log('Сброс истории до чистого начального коммита без старых версий...')
      execSync('git checkout --orphan fresh-main', { stdio: 'inherit' })
      execSync('git add -A', { stdio: 'inherit' })
      execSync('git commit -m "Initial commit: Dark Oak v0.0.6"', { stdio: 'inherit' })
      execSync(`git push ${pushUrl} fresh-main:main --force`, { stdio: 'inherit' })
      execSync('git checkout -B main fresh-main', { stdio: 'inherit' })
      execSync('git branch -D fresh-main', { stdio: 'ignore' })
      console.log('Вся старая история и коммиты на GitHub заменены одним чистым коммитом.')
    }

    console.log('Очистка GitHub репозитория ' + repo + ' полностью завершена!')
  } catch (err) {
    const msg = err.response?.data?.message || err.message
    console.error('Ошибка:', msg)
    process.exit(1)
  }
}

run()
