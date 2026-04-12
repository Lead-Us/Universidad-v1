import { createContext, useContext, useEffect } from 'react';

// ── Canva dark theme — purple accent ─────────────────────────────────────
const CANVA = {
  accent:       '#7C3AED',
  accentRgb:    '124,58,237',
  textPrimary:  '#F0EEFF',
  textSecondary:'rgba(240,238,255,0.72)',
  textMuted:    'rgba(240,238,255,0.42)',
  surface:      '#1C1A2C',
  surfaceHover: '#242236',
  border:       'rgba(255,255,255,0.08)',
  shadow:       '0 4px 16px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.06)',
  shadowHover:  '0 12px 40px rgba(0,0,0,0.50), 0 4px 12px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.10)',
  gradient:     '#100E1A',
  bgSolid:      '#100E1A',
  blur:         'none',
};

function applyTheme() {
  const el = document.documentElement;
  const t  = CANVA;

  el.style.setProperty('--lg-bg-gradient',   t.gradient);
  el.style.setProperty('--bg-app',           t.bgSolid);
  el.style.setProperty('--bg-app-pure',      '#0C0A15');
  el.style.setProperty('--lg-surface',       t.surface);
  el.style.setProperty('--lg-surface-hover', t.surfaceHover);
  el.style.setProperty('--lg-surface-subtle','rgba(23,21,34,0.80)');
  el.style.setProperty('--lg-border',        t.border);
  el.style.setProperty('--lg-border-bottom', 'rgba(255,255,255,0.05)');
  el.style.setProperty('--lg-specular',      'rgba(255,255,255,0.04)');
  el.style.setProperty('--lg-shadow',        t.shadow);
  el.style.setProperty('--lg-shadow-hover',  t.shadowHover);
  el.style.setProperty('--lg-shadow-xs',     '0 1px 3px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.05)');
  el.style.setProperty('--lg-shadow-nav',    '1px 0 0 rgba(255,255,255,0.05), 4px 0 16px rgba(0,0,0,0.20)');
  el.style.setProperty('--lg-blur-base',     'none');
  el.style.setProperty('--blur-sm',          'none');
  el.style.setProperty('--blur-base',        'none');
  el.style.setProperty('--blur-lg',          'none');
  el.style.setProperty('--text-primary',     t.textPrimary);
  el.style.setProperty('--text-secondary',   t.textSecondary);
  el.style.setProperty('--text-muted',       t.textMuted);
  el.style.setProperty('--text-title',       t.textPrimary);
  el.style.setProperty('--text-xs',   '0.75rem');
  el.style.setProperty('--text-sm',   '0.875rem');
  el.style.setProperty('--text-base', '1rem');
  el.style.setProperty('--text-lg',   '1.125rem');
  el.style.setProperty('--text-xl',   '1.375rem');
  el.style.setProperty('--text-2xl',  '1.75rem');
  el.style.setProperty('--text-3xl',  '2.25rem');
  el.style.setProperty('--accent',     t.accent);
  el.style.setProperty('--accent-rgb', t.accentRgb);
  el.style.setProperty('--accent-bg',  `rgba(${t.accentRgb},0.15)`);
  el.style.setProperty('--accent-gradient', 'linear-gradient(135deg,#8B5CF6 0%,#6D28D9 100%)');
  el.style.setProperty('--color-success', '#34D399');
  el.style.setProperty('--color-danger',  '#F87171');
  el.style.setProperty('--color-warning', '#FBBF24');
  el.style.setProperty('--color-info',    '#60A5FA');
  el.style.setProperty('--dur-instant','120ms');
  el.style.setProperty('--dur-fast',   '180ms');
  el.style.setProperty('--dur-base',   '240ms');
  el.style.setProperty('--dur-slow',   '360ms');
  el.style.setProperty('--dur-xslow',  '500ms');
  el.style.setProperty('--neutral-bubble',       'rgba(255,255,255,0.08)');
  el.style.setProperty('--neutral-bubble-faint', 'rgba(255,255,255,0.04)');
  el.style.setProperty('--neutral-hover',        'rgba(255,255,255,0.06)');
  el.style.setProperty('--btn-bg',       'rgba(255,255,255,0.08)');
  el.style.setProperty('--btn-bg-hover', 'rgba(255,255,255,0.12)');
  el.style.setProperty('--btn-text',     '#F0EEFF');
  el.style.setProperty('--glass',         t.surface);
  el.style.setProperty('--glass-border',  t.border);
  el.style.setProperty('--bg-secondary',  t.surface);
  el.style.setProperty('--bg-elevated',   t.surfaceHover);
  el.style.setProperty('--border-subtle', 'rgba(255,255,255,0.06)');
  el.style.setProperty('--border-color',  t.border);
  el.style.setProperty('--border-strong', 'rgba(255,255,255,0.14)');
  el.style.setProperty('--input-bg',       'rgba(255,255,255,0.06)');
  el.style.setProperty('--input-bg-focus', 'rgba(255,255,255,0.08)');
  el.style.setProperty('--input-border',   'rgba(255,255,255,0.12)');
  el.filter = '';
}

// ── Context ─────────────────────────────────────────────────────────────────
const SettingsContext = createContext({ settings: {}, update: () => {}, reset: () => {} });

export function SettingsProvider({ children }) {
  useEffect(() => { applyTheme(); }, []);
  return (
    <SettingsContext.Provider value={{ settings: {}, update: () => {}, reset: () => {} }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
