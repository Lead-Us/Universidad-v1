import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── Presets ──────────────────────────────────────────────────────────
export const BG_PRESETS = [
  { id: 'white',  label: 'Claro',   value: '#f0f0f0',  dark: false },
  { id: 'warm',   label: 'Cálido',  value: '#f5f0e8',  dark: false },
  { id: 'cool',   label: 'Frío',    value: '#e8eef5',  dark: false },
  { id: 'dark',   label: 'Oscuro',  value: '#111111',  dark: true  },
  { id: 'night',  label: 'Noche',   value: '#1a1a2e',  dark: true  },
];

export const GLASS_PRESETS = [
  { id: 'light',   label: 'Suave',    opacity: 0.12 },
  { id: 'medium',  label: 'Medio',    opacity: 0.18 },
  { id: 'strong',  label: 'Fuerte',   opacity: 0.28 },
];

export const ACCENT_PRESETS = [
  { id: 'blue',    label: 'Azul',     value: '#4f8ef7' },
  { id: 'violet',  label: 'Violeta',  value: '#bf5ff1' },
  { id: 'teal',    label: 'Teal',     value: '#2fc4c4' },
  { id: 'green',   label: 'Verde',    value: '#4cd97b' },
  { id: 'amber',   label: 'Ámbar',    value: '#e6a530' },
  { id: 'red',     label: 'Rojo',     value: '#e05a5a' },
  { id: 'orange',  label: 'Naranja',  value: '#f0814a' },
  { id: 'pink',    label: 'Rosa',     value: '#f050a8' },
  { id: 'coral',   label: 'Coral',    value: '#f97066' },
  { id: 'cyan',    label: 'Cian',     value: '#06b6d4' },
  { id: 'lime',    label: 'Lima',     value: '#84cc16' },
  { id: 'indigo',  label: 'Índigo',   value: '#6366f1' },
  { id: 'emerald', label: 'Esmeralda',value: '#10b981' },
  { id: 'fuchsia', label: 'Fucsia',   value: '#e879f9' },
];

export const FONT_COLOR_PRESETS = [
  { id: 'auto',  label: 'Auto' },
  { id: 'dark',  label: 'Oscuro',  primary: '#111827', secondary: 'rgba(0,0,0,0.55)', muted: 'rgba(0,0,0,0.32)' },
  { id: 'light', label: 'Claro',   primary: '#ffffff', secondary: 'rgba(255,255,255,0.65)', muted: 'rgba(255,255,255,0.38)' },
  { id: 'warm',  label: 'Cálido',  primary: '#1c1410', secondary: 'rgba(28,20,16,0.55)', muted: 'rgba(28,20,16,0.35)' },
  { id: 'cool',  label: 'Frío',    primary: '#0d1b2a', secondary: 'rgba(13,27,42,0.55)', muted: 'rgba(13,27,42,0.35)' },
];

export const FONT_SIZE_PRESETS = [
  { id: 'sm',  label: 'Pequeño', base: '13px', sm: '11px', lg: '16px', xl: '20px', '2xl': '24px', '3xl': '30px' },
  { id: 'md',  label: 'Normal',  base: '14px', sm: '12px', lg: '18px', xl: '22px', '2xl': '28px', '3xl': '36px' },
  { id: 'lg',  label: 'Grande',  base: '16px', sm: '13px', lg: '20px', xl: '26px', '2xl': '32px', '3xl': '42px' },
];

export const TITLE_COLOR_PRESETS = [
  { id: 'auto',    label: 'Auto' },
  { id: 'accent',  label: 'Acento',  value: 'var(--accent)' },
  { id: 'white',   label: 'Blanco',  value: '#ffffff' },
  { id: 'dark',    label: 'Negro',   value: '#111827' },
  { id: 'muted',   label: 'Suave',   value: 'var(--text-secondary)' },
];

export const BLUR_PRESETS = [
  { id: 'none',    label: 'Sin blur',  sm: 'blur(0px)',  base: 'blur(0px)',  lg: 'blur(0px)'  },
  { id: 'soft',    label: 'Suave',     sm: 'blur(6px)',  base: 'blur(12px)', lg: 'blur(20px)' },
  { id: 'strong',  label: 'Fuerte',    sm: 'blur(10px)', base: 'blur(20px)', lg: 'blur(32px)' },
];

export const SPEED_PRESETS = [
  { id: 'fast',   label: 'Rápido',  instant: '80ms',  fast: '160ms', base: '220ms', slow: '320ms', xslow: '440ms' },
  { id: 'medium', label: 'Normal',  instant: '150ms', fast: '280ms', base: '380ms', slow: '520ms', xslow: '700ms' },
  { id: 'slow',   label: 'Lento',   instant: '220ms', fast: '420ms', base: '580ms', slow: '800ms', xslow: '1100ms' },
];

// ── Defaults ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  bgPreset:         'white',
  glassPreset:      'light',
  accentPreset:     'blue',
  blurPreset:       'strong',
  speedPreset:      'slow',
  fontPreset:       'auto',
  fontSizePreset:   'md',
  titleColorPreset: 'auto',
};

const STORAGE_KEY = 'universidad-v1-settings';

// ── Helpers ───────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

// ── Apply to DOM ──────────────────────────────────────────────────────
function applySettings(settings) {
  const el = document.documentElement;
  const bg      = BG_PRESETS.find(p => p.id === settings.bgPreset)        ?? BG_PRESETS[0];
  const glass   = GLASS_PRESETS.find(p => p.id === settings.glassPreset)  ?? GLASS_PRESETS[0];
  const accent  = ACCENT_PRESETS.find(p => p.id === settings.accentPreset)?? ACCENT_PRESETS[0];
  const blur    = BLUR_PRESETS.find(p => p.id === settings.blurPreset)    ?? BLUR_PRESETS[2];
  const speed   = SPEED_PRESETS.find(p => p.id === settings.speedPreset)  ?? SPEED_PRESETS[2];
  const fontPre = FONT_COLOR_PRESETS.find(p => p.id === settings.fontPreset) ?? FONT_COLOR_PRESETS[0];

  const isDark = bg.dark === true;

  // ── Background ──
  el.style.setProperty('--bg-app', bg.value);

  // ── Liquid Glass surface vars — different for dark/light ──
  const surfaceAlpha = glass.opacity;
  if (isDark) {
    el.style.setProperty('--lg-surface',         `rgba(255,255,255,${surfaceAlpha})`);
    el.style.setProperty('--lg-surface-hover',   `rgba(255,255,255,${surfaceAlpha + 0.06})`);
    el.style.setProperty('--lg-surface-subtle',  `rgba(255,255,255,${Math.max(surfaceAlpha - 0.04, 0.04)})`);
    el.style.setProperty('--lg-border',          'rgba(255,255,255,0.15)');
    el.style.setProperty('--lg-border-bottom',   'rgba(0,0,0,0.35)');
    el.style.setProperty('--lg-specular',        'rgba(255,255,255,0.22)');
    el.style.setProperty('--lg-shadow',
      '0 2px 8px rgba(0,0,0,0.30), 0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)');
    el.style.setProperty('--lg-shadow-hover',
      '0 4px 16px rgba(0,0,0,0.40), 0 16px 48px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.14)');
    el.style.setProperty('--lg-shadow-xs',
      '0 1px 4px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.30)');
    // Dark gradient background — vibrant blobs on dark base
    el.style.setProperty('--lg-bg-gradient',
      `radial-gradient(ellipse 70% 50% at 20% 30%, rgba(79,142,247,0.18) 0%, transparent 60%),
       radial-gradient(ellipse 60% 60% at 80% 70%, rgba(191,95,241,0.14) 0%, transparent 60%),
       radial-gradient(ellipse 50% 40% at 50% 50%, rgba(44,196,196,0.10) 0%, transparent 60%),
       ${bg.value}`);
  } else {
    el.style.setProperty('--lg-surface',         `rgba(255,255,255,${0.10 + surfaceAlpha})`);
    el.style.setProperty('--lg-surface-hover',   `rgba(255,255,255,${0.16 + surfaceAlpha})`);
    el.style.setProperty('--lg-surface-subtle',  `rgba(255,255,255,${0.06 + surfaceAlpha})`);
    el.style.setProperty('--lg-border',          'rgba(255,255,255,0.38)');
    el.style.setProperty('--lg-border-bottom',   'rgba(0,0,0,0.07)');
    el.style.setProperty('--lg-specular',        'rgba(255,255,255,0.55)');
    el.style.setProperty('--lg-shadow',
      '0 2px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.50)');
    el.style.setProperty('--lg-shadow-hover',
      '0 4px 16px rgba(0,0,0,0.12), 0 16px 48px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.60)');
    el.style.setProperty('--lg-shadow-xs',
      '0 1px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)');
    el.style.setProperty('--lg-bg-gradient',
      `radial-gradient(ellipse 70% 50% at 20% 30%, rgba(99,179,237,0.25) 0%, transparent 60%),
       radial-gradient(ellipse 60% 60% at 80% 70%, rgba(167,139,250,0.20) 0%, transparent 60%),
       radial-gradient(ellipse 50% 40% at 50% 50%, rgba(52,211,153,0.12) 0%, transparent 60%),
       ${bg.value}`);
  }

  // Legacy compat aliases
  el.style.setProperty('--glass',         `rgba(255,255,255,${isDark ? surfaceAlpha : 0.10 + surfaceAlpha})`);
  el.style.setProperty('--glass-border',  isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.38)');
  el.style.setProperty('--bg-secondary',  isDark ? `rgba(255,255,255,${surfaceAlpha})` : `rgba(255,255,255,${0.10 + surfaceAlpha})`);
  el.style.setProperty('--bg-elevated',   isDark ? `rgba(255,255,255,${Math.max(surfaceAlpha - 0.04, 0.03)})` : `rgba(255,255,255,${0.08 + surfaceAlpha})`);
  el.style.setProperty('--border-subtle', isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.35)');
  el.style.setProperty('--border-color',  isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.38)');
  el.style.setProperty('--border-strong', isDark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.55)');

  // ── Font / Text Colors ──
  let textPrimary, textSecondary, textMuted;
  if (fontPre.id === 'auto') {
    if (isDark) {
      textPrimary   = '#ffffff';
      textSecondary = 'rgba(255,255,255,0.65)';
      textMuted     = 'rgba(255,255,255,0.38)';
    } else {
      textPrimary   = '#111827';
      textSecondary = 'rgba(0,0,0,0.55)';
      textMuted     = 'rgba(0,0,0,0.35)';
    }
  } else {
    textPrimary   = fontPre.primary;
    textSecondary = fontPre.secondary;
    textMuted     = fontPre.muted;
  }
  el.style.setProperty('--text-primary',   textPrimary);
  el.style.setProperty('--text-secondary', textSecondary);
  el.style.setProperty('--text-muted',     textMuted);

  // Font size
  const fontSizePre = FONT_SIZE_PRESETS.find(p => p.id === settings.fontSizePreset) ?? FONT_SIZE_PRESETS[1];
  el.style.setProperty('--text-xs',  fontSizePre.sm);
  el.style.setProperty('--text-sm',  fontSizePre.base);
  el.style.setProperty('--text-base',fontSizePre.base);
  el.style.setProperty('--text-lg',  fontSizePre.lg);
  el.style.setProperty('--text-xl',  fontSizePre.xl);
  el.style.setProperty('--text-2xl', fontSizePre['2xl']);
  el.style.setProperty('--text-3xl', fontSizePre['3xl']);

  // Title color
  const titleColorPre = TITLE_COLOR_PRESETS.find(p => p.id === settings.titleColorPreset) ?? TITLE_COLOR_PRESETS[0];
  const titleColor = titleColorPre.id === 'auto' ? textPrimary : titleColorPre.value;
  el.style.setProperty('--text-title', titleColor);

  // ── Accent ──
  el.style.setProperty('--color-info', accent.value);
  el.style.setProperty('--accent',     accent.value);
  const { r, g, b } = hexToRgb(accent.value);
  el.style.setProperty('--accent-rgb', `${r},${g},${b}`);
  el.style.setProperty('--accent-bg',  `rgba(${r},${g},${b},0.12)`);

  // ── Blur ──
  el.style.setProperty('--blur-sm',   blur.sm);
  el.style.setProperty('--blur-base', blur.base);
  el.style.setProperty('--blur-lg',   blur.lg);
  el.style.setProperty('--lg-blur-base', `${blur.base} saturate(180%) brightness(${isDark ? 1.02 : 1.05})`);

  // ── Speed ──
  el.style.setProperty('--dur-instant', speed.instant);
  el.style.setProperty('--dur-fast',    speed.fast);
  el.style.setProperty('--dur-base',    speed.base);
  el.style.setProperty('--dur-slow',    speed.slow);
  el.style.setProperty('--dur-xslow',   speed.xslow);
}

// ── Context ───────────────────────────────────────────────────────────
const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
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
