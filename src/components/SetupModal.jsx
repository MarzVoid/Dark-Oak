import React, { useState, useEffect, useRef } from 'react'
import { useI18n } from '../i18n/I18nContext'

export default function SetupModal({ onComplete, initialDir }) {
  const { language, setLanguage, t } = useI18n()
  const [step, setStep] = useState(1)
  const [recipesDir, setRecipesDir] = useState(initialDir || '')
  const [isSelecting, setIsSelecting] = useState(false)
  const [isDissolving, setIsDissolving] = useState(false)

  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const headerRef = useRef(null)
  const cardRef = useRef(null)

  useEffect(() => {
    if (initialDir) {
      setRecipesDir(initialDir)
    } else if (window.cherryApi && window.cherryApi.getRecipesDir) {
      window.cherryApi.getRecipesDir().then(res => {
        if (res && res.dir) {
          setRecipesDir(res.dir)
        }
      }).catch(() => {})
    }
  }, [initialDir])

  const handleBrowse = async () => {
    if (window.cherryApi && window.cherryApi.selectDirectory) {
      setIsSelecting(true)
      try {
        const res = await window.cherryApi.selectDirectory()
        if (res && res.success && res.path) {
          setRecipesDir(res.path)
        }
      } catch (e) {
      } finally {
        setIsSelecting(false)
      }
    }
  }

  const startTelegramPixelDissolve = () => {
    const canvas = canvasRef.current
    const header = headerRef.current
    const card = cardRef.current
    if (!canvas) {
      finalizeSetup()
      return
    }

    setIsDissolving(true)

    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    const headerRect = header ? header.getBoundingClientRect() : null
    const cardRect = card ? card.getBoundingClientRect() : null

    const bgPalette = ['#140d08', '#140d08', '#1a110a', '#22150c', '#2c190e', '#382012']
    const headerPalette = ['#f5eedc', '#debfa3', '#d49b65', '#c88a4c', '#ffffff']
    const cardPalette = ['#c88a4c', '#d49b65', '#f5eedc', '#debfa3', '#8c5a2b', '#24140b', '#3a2414']

    const particles = []
    const stepSize = 5

    for (let x = 0; x < width; x += stepSize) {
      for (let y = 0; y < height; y += stepSize) {
        const isHeader = headerRect && x >= headerRect.left && x <= headerRect.right && y >= headerRect.top && y <= headerRect.bottom
        const isCard = cardRect && x >= cardRect.left && x <= cardRect.right && y >= cardRect.top && y <= cardRect.bottom

        let color = null
        if (isHeader) {
          if (Math.random() > 0.16) {
            color = headerPalette[Math.floor(Math.random() * headerPalette.length)]
          }
        } else if (isCard) {
          if (Math.random() > 0.16) {
            color = cardPalette[Math.floor(Math.random() * cardPalette.length)]
          }
        } else {
          if (Math.random() > 0.4) {
            color = bgPalette[Math.floor(Math.random() * bgPalette.length)]
          }
        }

        if (color) {
          particles.push({
            x: x + (Math.random() - 0.5) * 2,
            y: y + (Math.random() - 0.5) * 2,
            size: Math.random() * 1.8 + 2.5,
            color,
            vx: (Math.random() - 0.3) * 2.8 + 1.4,
            vy: -Math.random() * 3.6 - 1.2,
            gravity: 0.045,
            alpha: 1,
            decay: 0.0035 + Math.random() * 0.0025,
            sizeDecay: 0.997,
            seed: Math.random() * 100
          })
        }
      }
    }

    const startTime = Date.now()
    let animationFrameId

    const render = () => {
      const now = Date.now()
      const elapsed = now - startTime

      ctx.clearRect(0, 0, width, height)

      let aliveCount = 0

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        if (p.alpha > 0.01) {
          aliveCount++

          const windTurbulence = Math.sin((elapsed / 320) + p.seed) * 0.7
          p.x += p.vx + windTurbulence
          p.y += p.vy
          p.vy += p.gravity
          p.alpha -= p.decay
          p.size *= p.sizeDecay

          ctx.globalAlpha = Math.max(0, p.alpha)
          ctx.fillStyle = p.color
          ctx.fillRect(p.x, p.y, p.size, p.size)
        }
      }

      ctx.globalAlpha = 1

      if (aliveCount > 0 && elapsed < 4200) {
        animationFrameId = requestAnimationFrame(render)
      } else {
        finalizeSetup()
      }
    }

    animationFrameId = requestAnimationFrame(render)
  }

  const finalizeSetup = async () => {
    if (recipesDir && window.cherryApi && window.cherryApi.setRecipesDir) {
      try {
        await window.cherryApi.setRecipesDir(recipesDir)
      } catch (e) {
      }
    }
    localStorage.setItem('dark_oak_setup_done', 'true')
    localStorage.setItem('dark_oak_recipes_dir', recipesDir)
    onComplete(recipesDir)
  }

  return (
    <>
      <div
        ref={overlayRef}
        className="setup-overlay"
        style={{
          opacity: isDissolving ? 0 : 1,
          pointerEvents: isDissolving ? 'none' : 'auto'
        }}
      >
        <div
          ref={headerRef}
          className="setup-top-header"
        >
          <h1 className="setup-brand-title">
            DARK OAK
          </h1>

          <div className="setup-dots">
            <span className={`setup-dot ${step === 1 ? 'active' : ''}`} />
            <span className={`setup-dot ${step === 2 ? 'active' : ''}`} />
          </div>
        </div>

        <div
          ref={cardRef}
          className="setup-card"
        >
          {step === 1 ? (
            <div className="setup-content">
              <div className="setup-lang-group">
                <button
                  type="button"
                  className={`setup-lang-btn ${language === 'ru' ? 'active' : ''}`}
                  onClick={() => setLanguage('ru')}
                >
                  Русский
                </button>

                <button
                  type="button"
                  className={`setup-lang-btn ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  English
                </button>
              </div>

              <button
                type="button"
                className="setup-action-btn setup-continue-btn"
                onClick={() => setStep(2)}
              >
                {language === 'ru' ? 'Продолжить' : 'Continue'}
              </button>
            </div>
          ) : (
            <div className="setup-content">
              <div className="setup-step-label">
                {language === 'ru' ? 'Выбор директории для рецептов' : 'Recipes Directory'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  className="setup-input"
                  value={recipesDir}
                  onChange={(e) => setRecipesDir(e.target.value)}
                  placeholder="C:\Users\...\Documents\Dark Oak"
                />
                <button
                  type="button"
                  className="setup-secondary-btn"
                  onClick={handleBrowse}
                  disabled={isSelecting}
                >
                  {language === 'ru' ? 'Обзор...' : 'Browse...'}
                </button>
              </div>

              <div className="setup-actions-row">
                <button
                  type="button"
                  className="setup-secondary-btn"
                  onClick={() => setStep(1)}
                  style={{ flex: 1 }}
                >
                  {language === 'ru' ? 'Назад' : 'Back'}
                </button>

                <button
                  type="button"
                  className="setup-action-btn"
                  onClick={startTelegramPixelDissolve}
                  disabled={isDissolving}
                  style={{ flex: 2 }}
                >
                  {language === 'ru' ? 'Начать использование' : 'Start Using'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="setup-canvas" />
    </>
  )
}
