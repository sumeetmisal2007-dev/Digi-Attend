import { useState, useEffect } from 'react'
import { Sun, Moon, GraduationCap } from 'lucide-react'

export default function ThemeToggle({ variant = 'compact' }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app_theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('app_theme', theme)
  }, [theme])

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'college', label: 'College', icon: GraduationCap }
  ]

  if (variant === 'compact') {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.12)',
          borderRadius: '20px',
          padding: '3px',
          gap: '2px',
          width: 'fit-content'
        }}
        title="Toggle Theme: Light, Dark, or College Heritage"
      >
        {themes.map(t => {
          const Icon = t.icon
          const isActive = theme === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: 'none',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--sidebar-text, var(--ink-soft))',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 0
              }}
              title={`${t.label} Theme`}
            >
              <Icon size={15} />
            </button>
          )
        })}
      </div>
    )
  }

  // Full button pill variant (e.g. for login page or top headers)
  return (
    <div 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(8px)',
        borderRadius: '24px',
        padding: '4px',
        gap: '4px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      {themes.map(t => {
        const Icon = t.icon
        const isActive = theme === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '18px',
              border: 'none',
              background: isActive ? '#ffffff' : 'transparent',
              color: isActive ? '#0f1d2f' : 'rgba(255, 255, 255, 0.85)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Icon size={14} />
            <span>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
