import { createContext, useContext, useEffect } from 'react';

// ── Canva-inspired theme — gray gradient accent ───────────────────────────
const CANVA = {
  accent:       '#3A3A3C',
  accentRgb:    '58,58,60',
  textPrimary:  '#1C1C1E',
  textSecondary:'#48484A',
  textMuted:    '#8E8E93',
  surface:      '#FFFFFF',
  surfaceHover: '#FAFAFA',
  border:       'rgba(0,0,0,0.09)',
  shadow:       '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
  shadowHover:  '0 12px 32px rgba(0,0,0,0.13), 0 4px 10px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)',
  gradient:     '#F7F8FA',
  bgSolid:      '#F7F8FA',
  blur:         'none',
};

function applyTheme() {
  const el = document.documentElement;
  const t  = CANVA;

  el.style.setProperty('--lg-bg-gradient',   t.gradient);
  el.style.setProperty('--bg-app',           t.bgSolid);
  el.style.setProperty('--lg-surface',       t.surface);
  el.style.setProperty('--lg-surface-hover', t.surfaceHover);
  el.style.setProperty('--lg-surface-subtle','#F5F5F7');
  el.style.setProperty('--lg-border',        t.border);
  el.style.setProperty('--lg-border-bottom', 'rgba(0,0,0,0.07)');
  el.style.setProperty('--lg-specular',      'transparent');
  el.style.setProperty('--lg-shadow',        t.shadow);
  el.style.setProperty('--lg-shadow-hover',  t.shadowHover);
  el.style.setProperty('--lg-shadow-xs',     '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)');
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
  el.style.setProperty('--accent-bg',  `rgba(${t.accentRgb},0.08)`);
  el.style.setProperty('--color-info', '#0A84FF');
  el.style.setProperty('--dur-instant','120ms');
  el.style.setProperty('--dur-fast',   '180ms');
  el.style.setProperty('--dur-base',   '240ms');
  el.style.setProperty('--dur-slow',   '360ms');
  el.style.setProperty('--dur-xslow',  '500ms');
  el.style.setProperty('--neutral-bubble',       'rgba(0,0,0,0.06)');
  el.style.setProperty('--neutral-bubble-faint', 'rgba(0,0,0,0.03)');
  el.style.setProperty('--neutral-hover',        'rgba(0,0,0,0.05)');
  el.style.setProperty('--glass',         t.surface);
  el.style.setProperty('--glass-border',  t.border);
  el.style.setProperty('--bg-secondary',  t.surface);
  el.style.setProperty('--bg-elevated',   t.surfaceHover);
  el.style.setProperty('--border-subtle', t.border);
  el.style.setProperty('--border-color',  t.border);
  el.style.setProperty('--border-strong', 'rgba(0,0,0,0.14)');
  el.style.setProperty('--input-bg',       '#FFFFFF');
  el.style.setProperty('--input-bg-focus', '#FFFFFF');
  el.style.setProperty('--input-border',   'rgba(0,0,0,0.18)');
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
