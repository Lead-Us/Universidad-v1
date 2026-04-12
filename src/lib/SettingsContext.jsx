import { createContext, useContext, useEffect } from 'react';

/* ── Dark mode design system — Indigo accent ─────────────────── */
const DARK = {
  bgApp:          '#0C0E14',
  bgSurface:      '#131620',
  bgElevated:     '#191C28',
  bgHover:        '#1E2130',
  textPrimary:    '#E8EBF4',
  textSecondary:  '#8890AB',
  textMuted:      '#4B5167',
  accent:         '#6366F1',
  accentRgb:      '99,102,241',
  border:         'rgba(255,255,255,0.07)',
  borderStrong:   'rgba(255,255,255,0.14)',
  shadow:         '0 0 0 1px rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.45)',
  shadowHover:    '0 0 0 1px rgba(99,102,241,0.35), 0 8px 36px rgba(0,0,0,0.55)',
};

function applyTheme() {
  const el = document.documentElement;
  const t  = DARK;

  el.setAttribute('data-theme', 'dark');

  el.style.setProperty('--bg-app',          t.bgApp);
  el.style.setProperty('--bg-surface',      t.bgSurface);
  el.style.setProperty('--bg-elevated',     t.bgElevated);
  el.style.setProperty('--bg-hover',        t.bgHover);

  el.style.setProperty('--lg-bg-gradient',   t.bgApp);
  el.style.setProperty('--lg-surface',       t.bgSurface);
  el.style.setProperty('--lg-surface-hover', t.bgElevated);
  el.style.setProperty('--lg-surface-subtle','#191C28');
  el.style.setProperty('--glass',            t.bgSurface);
  el.style.setProperty('--glass-strong',     t.bgElevated);
  el.style.setProperty('--glass-soft',       t.bgHover);
  el.style.setProperty('--glass-subtle',     t.bgElevated);
  el.style.setProperty('--bg-secondary',     t.bgElevated);
  el.style.setProperty('--bg-elevated',      t.bgElevated);

  el.style.setProperty('--lg-border',        t.border);
  el.style.setProperty('--lg-border-bottom', 'rgba(255,255,255,0.04)');
  el.style.setProperty('--lg-specular',      'transparent');
  el.style.setProperty('--glass-border',     t.border);
  el.style.setProperty('--glass-border-hover', t.borderStrong);
  el.style.setProperty('--glass-border-input', 'rgba(255,255,255,0.10)');
  el.style.setProperty('--border-subtle',    'rgba(255,255,255,0.05)');
  el.style.setProperty('--border-color',     t.border);
  el.style.setProperty('--border-strong',    t.borderStrong);

  el.style.setProperty('--lg-shadow',        t.shadow);
  el.style.setProperty('--lg-shadow-hover',  t.shadowHover);
  el.style.setProperty('--lg-shadow-xs',     '0 0 0 1px rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.35)');
  el.style.setProperty('--lg-shadow-nav',    '1px 0 0 rgba(255,255,255,0.06)');
  el.style.setProperty('--lg-shadow-modal',  '0 0 0 1px rgba(255,255,255,0.08), 0 16px 64px rgba(0,0,0,0.65)');
  el.style.setProperty('--shadow-xl',        '0 0 0 1px rgba(255,255,255,0.08), 0 16px 64px rgba(0,0,0,0.65)');

  el.style.setProperty('--lg-blur-base',  'none');
  el.style.setProperty('--lg-blur-xs',    'none');
  el.style.setProperty('--lg-blur-md',    'none');
  el.style.setProperty('--lg-blur-lg',    'none');
  el.style.setProperty('--lg-blur-xl',    'none');
  el.style.setProperty('--lg-blur-nav',   'none');
  el.style.setProperty('--lg-blur-modal', 'none');
  el.style.setProperty('--blur-sm',       'none');
  el.style.setProperty('--blur-base',     'none');
  el.style.setProperty('--blur-lg',       'none');

  el.style.setProperty('--text-primary',   t.textPrimary);
  el.style.setProperty('--text-secondary', t.textSecondary);
  el.style.setProperty('--text-muted',     t.textMuted);
  el.style.setProperty('--text-title',     '#F0F2FA');

  el.style.setProperty('--text-xs',   '0.75rem');
  el.style.setProperty('--text-sm',   '0.875rem');
  el.style.setProperty('--text-base', '1rem');
  el.style.setProperty('--text-lg',   '1.125rem');
  el.style.setProperty('--text-xl',   '1.375rem');
  el.style.setProperty('--text-2xl',  '1.75rem');
  el.style.setProperty('--text-3xl',  '2.25rem');

  el.style.setProperty('--accent',          t.accent);
  el.style.setProperty('--accent-rgb',      t.accentRgb);
  el.style.setProperty('--accent-bg',       `rgba(${t.accentRgb},0.14)`);
  el.style.setProperty('--accent-gradient', 'linear-gradient(135deg, #818CF8 0%, #5254CC 100%)');

  el.style.setProperty('--color-success',  '#22C55E');
  el.style.setProperty('--color-warning',  '#F59E0B');
  el.style.setProperty('--color-danger',   '#EF4444');
  el.style.setProperty('--color-info',     '#38BDF8');

  el.style.setProperty('--input-bg',       '#1A1D2A');
  el.style.setProperty('--input-bg-focus', '#1E2130');
  el.style.setProperty('--input-border',   'rgba(255,255,255,0.10)');

  el.style.setProperty('--btn-bg',       '#1E2130');
  el.style.setProperty('--btn-bg-hover', '#242738');
  el.style.setProperty('--btn-text',     t.textPrimary);

  el.style.setProperty('--neutral-bubble',       'rgba(255,255,255,0.07)');
  el.style.setProperty('--neutral-bubble-faint', 'rgba(255,255,255,0.04)');
  el.style.setProperty('--neutral-hover',        'rgba(255,255,255,0.06)');

  el.style.setProperty('--dur-instant', '100ms');
  el.style.setProperty('--dur-fast',    '160ms');
  el.style.setProperty('--dur-base',    '220ms');
  el.style.setProperty('--dur-slow',    '320ms');
  el.style.setProperty('--dur-xslow',   '480ms');
}

/* ── Context ────────────────────────────────────────────────────── */
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
