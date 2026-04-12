import { createContext, useContext, useEffect } from 'react';

// ── Canva light theme — purple accent ─────────────────────────────────────
const CANVA = {
  accent:       '#7C3AED',
  accentRgb:    '124,58,237',
  textPrimary:  '#1C1C1E',
  textSecondary:'rgba(60,60,67,0.75)',
  textMuted:    'rgba(60,60,67,0.45)',
  surface:      '#FFFFFF',
  surfaceHover: '#F7F7FA',
  border:       'rgba(0,0,0,0.09)',
  shadow:       '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
  shadowHover:  '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
  gradient:     '#F2F2F7',
  bgSolid:      '#F2F2F7',
  blur:         'none',
};

function applyTheme() {
  const el = document.documentElement;
  const t  = CANVA;

  el.style.setProperty('--lg-bg-gradient',   t.gradient);
  el.style.setProperty('--bg-app',           t.bgSolid);
  el.style.setProperty('--bg-app-pure',      '#FFFFFF');
  el.style.setProperty('--lg-surface',       t.surface);
  el.style.setProperty('--lg-surface-hover', t.surfaceHover);
  el.style.setProperty('--lg-surface-active','#EBEBF0');
  el.style.setProperty('--lg-surface-subtle','rgba(247,247,250,0.80)');
  el.style.setProperty('--lg-border',        t.border);
  el.style.setProperty('--lg-border-bottom', 'rgba(0,0,0,0.06)');
  el.style.setProperty('--lg-border-dark',   'rgba(0,0,0,0.14)');
  el.style.setProperty('--lg-specular',      'rgba(255,255,255,0.80)');
  el.style.setProperty('--lg-shadow',        t.shadow);
  el.style.setProperty('--lg-shadow-hover',  t.shadowHover);
  el.style.setProperty('--lg-shadow-xs',     '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)');
  el.style.setProperty('--lg-shadow-modal',  '0 20px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.08)');
  el.style.setProperty('--lg-shadow-nav',    '1px 0 0 rgba(0,0,0,0.09), 4px 0 16px rgba(0,0,0,0.06)');
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
  el.style.setProperty('--accent-bg',  `rgba(${t.accentRgb},0.10)`);
  el.style.setProperty('--accent-gradient', 'linear-gradient(135deg,#8B5CF6 0%,#6D28D9 100%)');
  el.style.setProperty('--color-success', '#10B981');
  el.style.setProperty('--color-danger',  '#EF4444');
  el.style.setProperty('--color-warning', '#F59E0B');
  el.style.setProperty('--color-info',    '#3B82F6');
  el.style.setProperty('--dur-instant','120ms');
  el.style.setProperty('--dur-fast',   '180ms');
  el.style.setProperty('--dur-base',   '240ms');
  el.style.setProperty('--dur-slow',   '360ms');
  el.style.setProperty('--dur-xslow',  '500ms');
  el.style.setProperty('--neutral-bubble',       'rgba(0,0,0,0.06)');
  el.style.setProperty('--neutral-bubble-faint', 'rgba(0,0,0,0.03)');
  el.style.setProperty('--neutral-hover',        'rgba(0,0,0,0.04)');
  el.style.setProperty('--btn-bg',       'rgba(0,0,0,0.06)');
  el.style.setProperty('--btn-bg-hover', 'rgba(0,0,0,0.09)');
  el.style.setProperty('--btn-text',     '#1C1C1E');
  el.style.setProperty('--glass',         t.surface);
  el.style.setProperty('--glass-border',  t.border);
  el.style.setProperty('--bg-secondary',  '#F7F7FA');
  el.style.setProperty('--bg-elevated',   '#EBEBF0');
  el.style.setProperty('--border-subtle', 'rgba(0,0,0,0.06)');
  el.style.setProperty('--border-color',  t.border);
  el.style.setProperty('--border-strong', 'rgba(0,0,0,0.16)');
  el.style.setProperty('--input-bg',       'rgba(0,0,0,0.04)');
  el.style.setProperty('--input-bg-focus', 'rgba(0,0,0,0.06)');
  el.style.setProperty('--input-border',   'rgba(0,0,0,0.12)');
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
