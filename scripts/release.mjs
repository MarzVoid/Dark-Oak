import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN
  try {
    const stdout = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    })
    const match = stdout.match(/password=([^\r\n]+)/)
    if (match) return match[1].trim()
  } catch (e) {
  }
  return null
}

function bumpVersion(currentVer, mode = 'patch') {
  const parts = currentVer.split('.').map((p) => parseInt(p, 10) || 0)
  let [major = 0, minor = 0, patch = 0] = parts

  if (mode === 'major') {
    major += 1
    minor = 0
    patch = 0
  } else if (mode === 'minor') {
    minor += 1
    patch = 0
  } else {
    patch += 1
  }

  return `${major}.${minor}.${patch}`
}

async function retryOperation(fn, description, maxRetries = 10, delayMs = 6000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || String(err)
      if (attempt === maxRetries) {
        throw new Error(`${description} failed after ${maxRetries} attempts: ${errMsg}`)
      }
      console.log(`[Network issue during ${description}: ${errMsg}]. Waiting ${delayMs / 1000}s before retry (attempt ${attempt + 1}/${maxRetries})...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

async function retryExec(cmd, options, maxRetries = 5, delayMs = 6000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return execSync(cmd, options)
    } catch (err) {
      if (attempt === maxRetries) {
        throw err
      }
      console.log(`[Git network error during: ${cmd}]. Waiting ${delayMs / 1000}s before retry (${attempt + 1}/${maxRetries})...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

async function run() {
  const token = getGitHubToken()
  if (!token) {
    throw new Error('GitHub token not found. Please log in with Git or set GITHUB_TOKEN environment variable.')
  }

  const pkgPath = path.join(rootDir, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

  const arg = process.argv[2]
  let newVersion = ''

  if (arg && /^\d+\.\d+\.\d+$/.test(arg)) {
    newVersion = arg
  } else {
    newVersion = bumpVersion(pkg.version || '0.0.0', arg || 'patch')
  }

  console.log(`Bumping version: ${pkg.version} -> ${newVersion}`)
  pkg.version = newVersion
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  const lockPath = path.join(rootDir, 'package-lock.json')
  if (fs.existsSync(lockPath)) {
    try {
      const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'))
      lock.version = newVersion
      if (lock.packages && lock.packages['']) {
        lock.packages[''].version = newVersion
      }
      fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n')
    } catch (e) {
    }
  }

  console.log('Building application and packaging Windows installer...')
  execSync('npm run dist', { cwd: rootDir, stdio: 'inherit' })

  const releaseDir = path.join(rootDir, 'release')
  if (!fs.existsSync(releaseDir)) {
    throw new Error('Release directory not found after build')
  }

  const files = fs.readdirSync(releaseDir)
  const exeName = files.find((f) => f.endsWith('.exe') && f.includes(newVersion) && !f.includes('__uninstaller') && !f.startsWith('win-'))
    || files.find((f) => f.endsWith('.exe') && !f.includes('__uninstaller') && !f.startsWith('win-'))
  if (!exeName) {
    throw new Error('Installer .exe not found in release directory')
  }

  const exePath = path.join(releaseDir, exeName)
  console.log(`Installer found: ${exeName} (${Math.round(fs.statSync(exePath).size / 1024 / 1024)} MB)`)

  console.log('Committing version bump and pushing tag...')
  execSync(`git add .`, { cwd: rootDir, stdio: 'inherit' })
  try {
    execSync(`git commit -m "Release v${newVersion}"`, { cwd: rootDir, stdio: 'inherit' })
  } catch (e) {
  }
  execSync(`git tag -f v${newVersion}`, { cwd: rootDir, stdio: 'inherit' })

  await retryExec(`git push origin main --tags`, { cwd: rootDir, stdio: 'inherit' }, 5, 6000)

  const repo = 'MarzVoid/Dark-Oak'
  console.log(`Creating or finding GitHub release on ${repo} for tag v${newVersion}...`)

  const relUrl = `https://api.github.com/repos/${repo}/releases`
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Dark-Oak-Release-Script'
  }

  let releaseData = await retryOperation(async () => {
    try {
      const existingRes = await axios.get(`${relUrl}/tags/v${newVersion}`, { headers, timeout: 30000 })
      console.log(`Found existing release: ID ${existingRes.data.id}`)
      return existingRes.data
    } catch (err) {
      if (err.response && err.response.status === 404) {
        const createRes = await axios.post(
          relUrl,
          {
            tag_name: `v${newVersion}`,
            name: `Dark Oak v${newVersion}`,
            body: `0.0.0!!!!!
            First version EVER
            I hope you like it :3`,
            draft: false,
            prerelease: false
          },
          { headers, timeout: 30000 }
        )
        console.log(`Release created: ID ${createRes.data.id}`)
        return createRes.data
      }
      throw err
    }
  }, 'Get or create release', 10, 5000)

  async function uploadAsset(filePath, fileName) {
    await retryOperation(async () => {
      try {
        const freshRelease = await axios.get(`${relUrl}/${releaseData.id}`, { headers, timeout: 30000 })
        const existing = (freshRelease.data.assets || []).find((a) => a.name === fileName)
        if (existing) {
          console.log(`Cleaning up previous asset ${fileName} (ID ${existing.id})...`)
          await axios.delete(`https://api.github.com/repos/${repo}/releases/assets/${existing.id}`, { headers, timeout: 30000 })
        }
      } catch (cleanupErr) {
      }

      console.log(`Uploading ${fileName} (${Math.round(fs.statSync(filePath).size / 1024 / 1024)} MB)...`)
      const fileStats = fs.statSync(filePath)
      const stream = fs.createReadStream(filePath)
      let lastLoggedPercent = -1

      await axios({
        method: 'POST',
        url: `https://uploads.github.com/repos/${repo}/releases/${releaseData.id}/assets?name=${encodeURIComponent(fileName)}`,
        data: stream,
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/octet-stream',
          'Content-Length': fileStats.size,
          'User-Agent': 'Dark-Oak-Release-Script'
        },
        timeout: 1800000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            if (percent !== lastLoggedPercent && percent % 10 === 0) {
              lastLoggedPercent = percent
              console.log(`Upload ${fileName}: ${percent}%`)
            }
          }
        }
      })
      console.log(`Successfully uploaded ${fileName}`)
    }, `Upload ${fileName}`, 10, 8000)
  }

  await uploadAsset(exePath, exeName)

  const blockmapName = `${exeName}.blockmap`
  const blockmapPath = path.join(releaseDir, blockmapName)
  if (fs.existsSync(blockmapPath)) {
    await uploadAsset(blockmapPath, blockmapName)
  }

  console.log(`Release v${newVersion} successfully published!`)
  console.log(`URL: https://github.com/${repo}/releases/tag/v${newVersion}`)
}

run().catch((err) => {
  console.error('Release failed:', err.response?.data || err.message || err)
  process.exit(1)
})
