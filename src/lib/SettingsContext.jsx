import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── Theme Presets (5 complete themes) ────────────────────────────────
export const THEME_PRESETS = [
  {
    id: 'claro',
    label: 'Claro',
    dark: false,
    accent: '#4f8ef7',
    accentRgb: '79,142,247',
    textPrimary: '#111827',
    textSecondary: 'rgba(0,0,0,0.58)',
    textMuted: 'rgba(0,0,0,0.36)',
    surface: 'rgba(255,255,255,0.55)',
    surfaceHover: 'rgba(255,255,255,0.72)',
    border: 'rgba(255,255,255,0.45)',
    shadow: '0 2px 8px rgba(0,0,0,0.07), 0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.55)',
    shadowHover: '0 4px 16px rgba(0,0,0,0.10), 0 16px 48px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.65)',
    gradient: 'radial-gradient(ellipse 70% 50% at 20% 30%, rgba(147,197,253,0.30) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 70%, rgba(196,181,253,0.22) 0%, transparent 60%), #f2f4f7',
    bgSolid: '#f2f4f7',
    blur: 'blur(20px) saturate(180%)',
  },
  {
    id: 'calido',
    label: 'Cálido',
    dark: false,
    accent: '#e6a530',
    accentRgb: '230,165,48',
    textPrimary: '#1c1208',
    textSecondary: 'rgba(28,18,8,0.58)',
    textMuted: 'rgba(28,18,8,0.36)',
    surface: 'rgba(255,248,235,0.55)',
    surfaceHover: 'rgba(255,248,235,0.72)',
    border: 'rgba(255,220,150,0.45)',
    shadow: '0 2px 8px rgba(80,40,0,0.08), 0 8px 32px rgba(80,40,0,0.11), inset 0 1px 0 rgba(255,240,200,0.55)',
    shadowHover: '0 4px 16px rgba(80,40,0,0.12), 0 16px 48px rgba(80,40,0,0.16), inset 0 1px 0 rgba(255,240,200,0.65)',
    gradient: 'radial-gradient(ellipse 70% 50% at 20% 30%, rgba(253,211,147,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 70%, rgba(252,182,122,0.22) 0%, transparent 60%), #f5efe6',
    bgSolid: '#f5efe6',
    blur: 'blur(20px) saturate(180%)',
  },
  {
    id: 'colorido',
    label: 'Colorido',
    dark: false,
    accent: '#6366f1',
    accentRgb: '99,102,241',
    textPrimary: '#1e1b4b',
    textSecondary: 'rgba(30,27,75,0.60)',
    textMuted: 'rgba(30,27,75,0.38)',
    surface: 'rgba(238,242,255,0.55)',
    surfaceHover: 'rgba(238,242,255,0.72)',
    border: 'rgba(199,210,254,0.55)',
    shadow: '0 2px 8px rgba(99,102,241,0.10), 0 8px 32px rgba(99,102,241,0.14), inset 0 1px 0 rgba(224,231,255,0.60)',
    shadowHover: '0 4px 16px rgba(99,102,241,0.14), 0 16px 48px rgba(99,102,241,0.18), inset 0 1px 0 rgba(224,231,255,0.70)',
    gradient: 'radial-gradient(ellipse 70% 50% at 15% 25%, rgba(167,139,250,0.35) 0%, transparent 55%), radial-gradient(ellipse 60% 60% at 85% 75%, rgba(236,72,153,0.20) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 50% 50%, rgba(56,189,248,0.18) 0%, transparent 55%), #eef2ff',
    bgSolid: '#eef2ff',
    blur: 'blur(20px) saturate(200%)',
  },
  {
    id: 'oscuro',
    label: 'Oscuro',
    dark: true,
    accent: '#4f8ef7',
    accentRgb: '79,142,247',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.65)',
    textMuted: 'rgba(255,255,255,0.38)',
    surface: 'rgba(255,255,255,0.08)',
    surfaceHover: 'rgba(255,255,255,0.13)',
    border: 'rgba(255,255,255,0.13)',
    shadow: '0 2px 8px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10)',
    shadowHover: '0 4px 16px rgba(0,0,0,0.45), 0 16px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.14)',
    gradient: 'radial-gradient(ellipse 70% 50% at 20% 30%, rgba(79,142,247,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 70%, rgba(191,95,241,0.14) 0%, transparent 60%), #111111',
    bgSolid: '#111111',
    blur: 'blur(20px) saturate(160%) brightness(1.02)',
  },
  {
    id: 'noche',
    label: 'Noche',
    dark: true,
    accent: '#a78bfa',
    accentRgb: '167,139,250',
    textPrimary: '#e2e8f0',
    textSecondary: 'rgba(226,232,240,0.62)',
    textMuted: 'rgba(226,232,240,0.36)',
    surface: 'rgba(255,255,255,0.06)',
    surfaceHover: 'rgba(255,255,255,0.10)',
    border: 'rgba(255,255,255,0.10)',
    shadow: '0 2px 8px rgba(0,0,0,0.45), 0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)',
    shadowHover: '0 4px 16px rgba(0,0,0,0.55), 0 16px 48px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.09)',
    gradient: 'radial-gradient(ellipse 60% 45% at 15% 20%, rgba(167,139,250,0.12) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 85% 80%, rgba(52,211,153,0.08) 0%, transparent 55%), #0d0f14',
    bgSolid: '#0d0f14',
    blur: 'blur(20px) saturate(140%) brightness(1.01)',
  },
];

// ── Defaults ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = { themePreset: 'claro' };
const STORAGE_KEY = 'universidad-v1-settings';

// ── Apply to DOM ──────────────────────────────────────────────────────
function applySettings(settings) {
  const el = document.documentElement;
  const theme = THEME_PRESETS.find(p => p.id === settings.themePreset) ?? THEME_PRESETS[0];

  // Background
  el.style.setProperty('--lg-bg-gradient', theme.gradient);
  el.style.setProperty('--bg-app', theme.bgSolid);

  // Surfaces
  el.style.setProperty('--lg-surface',        theme.surface);
  el.style.setProperty('--lg-surface-hover',  theme.surfaceHover);
  el.style.setProperty('--lg-surface-subtle', theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.30)');

  // Borders
  el.style.setProperty('--lg-border',        theme.border);
  el.style.setProperty('--lg-border-bottom', theme.dark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.06)');
  el.style.setProperty('--lg-specular',      theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.55)');

  // Shadows
  el.style.setProperty('--lg-shadow',       theme.shadow);
  el.style.setProperty('--lg-shadow-hover', theme.shadowHover);
  el.style.setProperty('--lg-shadow-xs',    theme.dark
    ? '0 1px 4px rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.38)'
    : '0 1px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.09)');

  // Blur
  el.style.setProperty('--lg-blur-base', theme.blur);
  el.style.setProperty('--blur-sm',   'blur(6px)');
  el.style.setProperty('--blur-base', 'blur(12px)');
  el.style.setProperty('--blur-lg',   'blur(20px)');

  // Text
  el.style.setProperty('--text-primary',   theme.textPrimary);
  el.style.setProperty('--text-secondary', theme.textSecondary);
  el.style.setProperty('--text-muted',     theme.textMuted);
  el.style.setProperty('--text-title',     theme.textPrimary);

  // Font sizes (fixed to normal scale)
  el.style.setProperty('--text-xs',   '12px');
  el.style.setProperty('--text-sm',   '14px');
  el.style.setProperty('--text-base', '14px');
  el.style.setProperty('--text-lg',   '18px');
  el.style.setProperty('--text-xl',   '22px');
  el.style.setProperty('--text-2xl',  '28px');
  el.style.setProperty('--text-3xl',  '36px');

  // Accent
  el.style.setProperty('--accent',     theme.accent);
  el.style.setProperty('--accent-rgb', theme.accentRgb);
  el.style.setProperty('--accent-bg',  `rgba(${theme.accentRgb},0.12)`);
  el.style.setProperty('--color-info', theme.accent);

  // Speed (fixed)
  el.style.setProperty('--dur-instant', '150ms');
  el.style.setProperty('--dur-fast',    '280ms');
  el.style.setProperty('--dur-base',    '380ms');
  el.style.setProperty('--dur-slow',    '520ms');
  el.style.setProperty('--dur-xslow',   '700ms');

  // Neutral bubble (pill badges on text) — adapts to dark/light
  el.style.setProperty('--neutral-bubble',       theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)');
  el.style.setProperty('--neutral-bubble-faint', theme.dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)');
  el.style.setProperty('--neutral-hover',        theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)');

  // Legacy compat aliases
  el.style.setProperty('--glass',         theme.surface);
  el.style.setProperty('--glass-border',  theme.border);
  el.style.setProperty('--bg-secondary',  theme.surface);
  el.style.setProperty('--bg-elevated',   theme.surfaceHover);
  el.style.setProperty('--border-subtle', theme.border);
  el.style.setProperty('--border-color',  theme.border);
  el.style.setProperty('--border-strong', theme.dark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.55)');
}

// ── Context ───────────────────────────────────────────────────────────
const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If new format with themePreset, use it; otherwise reset to default
        if (parsed.themePreset) return { ...DEFAULT_SETTINGS, ...parsed };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    applySettings(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = useCallback((key, value) => {
    setSettings(s => ({ ...s, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
};
