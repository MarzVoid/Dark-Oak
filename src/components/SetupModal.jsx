import React, { useState, useEffect, useRef } from 'react'
import { useI18n } from '../i18n/I18nContext'

export default function SetupModal({ onComplete, initialDir }) {
  const { language, setLanguage, t } = useI18n()
  const [step, setStep] = useState(1)
  const [recipesDir, setRecipesDir] = useState(initialDir || '')
  const [isSelecting, setIsSelecting] = useState(false)
  const [isDissolving, setIsDissolving] = useState(false)

  const canvasRef = useRef(null)
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
    const card = cardRef.current
    if (!canvas || !card) {
      finalizeSetup()
      return
    }

    setIsDissolving(true)

    const rect = card.getBoundingClientRect()
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')

    const particles = []
    const palette = ['#d49b65', '#e6bd93', '#8c5a2b', '#24170d', '#f5eedc', '#3a2414', '#1b120a']
    const stepSize = 6

    for (let x = rect.left; x < rect.right; x += stepSize) {
      for (let y = rect.top; y < rect.bottom; y += stepSize) {
        if (Math.random() > 0.15) {
          particles.push({
            x: x + (Math.random() - 0.5) * 2,
            y: y + (Math.random() - 0.5) * 2,
            vx: (Math.random() - 0.5) * 6 + (Math.random() - 0.5) * 2,
            vy: -Math.random() * 4.5 - 1.2,
            size: Math.random() * 4 + 3,
            alpha: 1,
            decay: Math.random() * 0.02 + 0.012,
            color: palette[Math.floor(Math.random() * palette.length)],
            gravity: 0.14
          })
        }
      }
    }

    let animationFrameId
    const startTime = Date.now()

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let aliveCount = 0

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (p.alpha > 0.01 && p.size > 0.5) {
          aliveCount++
          ctx.save()
          ctx.globalAlpha = Math.max(0, p.alpha)
          ctx.fillStyle = p.color
          ctx.fillRect(p.x, p.y, p.size, p.size)
          ctx.restore()

          p.x += p.vx
          p.y += p.vy
          p.vy += p.gravity
          p.alpha -= p.decay
          p.size *= 0.985
        }
      }

      if (aliveCount > 0 && Date.now() - startTime < 1400) {
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
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      backgroundColor: '#140d08',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10
        }}
      />

      <div
        ref={cardRef}
        style={{
          width: '460px',
          maxWidth: '92%',
          backgroundColor: '#140d08',
          border: '1.5px solid rgba(212, 155, 101, 0.28)',
          borderRadius: '14px',
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '26px',
          opacity: isDissolving ? 0 : 1,
          transition: 'opacity 0.2s ease',
          zIndex: 5
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            color: '#f5eedc',
            margin: '0 0 6px 0',
            letterSpacing: '1.5px'
          }}>
            DARK OAK
          </h1>
          <div style={{
            fontSize: '0.85rem',
            color: '#d49b65',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {step === 1
              ? (language === 'ru' ? 'Выбор языка' : 'Language Selection')
              : (language === 'ru' ? 'Папка с рецептами' : 'Recipes Directory')}
          </div>
        </div>

        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setLanguage('ru')}
                style={{
                  padding: '16px 20px',
                  borderRadius: '10px',
                  backgroundColor: language === 'ru' ? 'rgba(212, 155, 101, 0.16)' : 'transparent',
                  border: language === 'ru' ? '1.5px solid #d49b65' : '1px solid rgba(212, 155, 101, 0.18)',
                  color: language === 'ru' ? '#ffffff' : '#cbbba8',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                Русский
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                style={{
                  padding: '16px 20px',
                  borderRadius: '10px',
                  backgroundColor: language === 'en' ? 'rgba(212, 155, 101, 0.16)' : 'transparent',
                  border: language === 'en' ? '1.5px solid #d49b65' : '1px solid rgba(212, 155, 101, 0.18)',
                  color: language === 'en' ? '#ffffff' : '#cbbba8',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                English
              </button>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setStep(2)}
              style={{
                height: '48px',
                fontSize: '1rem',
                fontWeight: 800,
                justifyContent: 'center',
                backgroundColor: '#d49b65',
                color: '#140d08',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              {language === 'ru' ? 'Далее' : 'Next'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                value={recipesDir}
                onChange={(e) => setRecipesDir(e.target.value)}
                placeholder="C:\Users\...\Documents\Dark Oak"
                style={{
                  height: '44px',
                  fontSize: '0.85rem',
                  padding: '0 14px',
                  backgroundColor: '#1b120a',
                  border: '1px solid rgba(212, 155, 101, 0.25)',
                  borderRadius: '8px',
                  color: '#f5eedc'
                }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={handleBrowse}
                disabled={isSelecting}
                style={{
                  height: '40px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(212, 155, 101, 0.35)',
                  color: '#d49b65',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {language === 'ru' ? 'Обзор...' : 'Browse...'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  height: '48px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(212, 155, 101, 0.25)',
                  color: '#cbbba8',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {language === 'ru' ? 'Назад' : 'Back'}
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={startTelegramPixelDissolve}
                disabled={isDissolving}
                style={{
                  flex: 2,
                  height: '48px',
                  fontSize: '1rem',
                  fontWeight: 900,
                  justifyContent: 'center',
                  backgroundColor: '#d49b65',
                  color: '#140d08',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {language === 'ru' ? 'Начать использование' : 'Start Using'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
