import { createContext, useContext, useEffect } from 'react';

// ── Single theme: Claro ───────────────────────────────────────────────
const CLARO = {
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
};

function applyTheme() {
  const el = document.documentElement;
  const t = CLARO;

  el.style.setProperty('--lg-bg-gradient', t.gradient);
  el.style.setProperty('--bg-app', t.bgSolid);
  el.style.setProperty('--lg-surface',        t.surface);
  el.style.setProperty('--lg-surface-hover',  t.surfaceHover);
  el.style.setProperty('--lg-surface-subtle', 'rgba(255,255,255,0.30)');
  el.style.setProperty('--lg-border',        t.border);
  el.style.setProperty('--lg-border-bottom', 'rgba(0,0,0,0.06)');
  el.style.setProperty('--lg-specular',      'rgba(255,255,255,0.55)');
  el.style.setProperty('--lg-shadow',       t.shadow);
  el.style.setProperty('--lg-shadow-hover', t.shadowHover);
  el.style.setProperty('--lg-shadow-xs',    '0 1px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.09)');
  el.style.setProperty('--lg-blur-base', t.blur);
  el.style.setProperty('--blur-sm',   'blur(6px)');
  el.style.setProperty('--blur-base', 'blur(12px)');
  el.style.setProperty('--blur-lg',   'blur(20px)');
  el.style.setProperty('--text-primary',   t.textPrimary);
  el.style.setProperty('--text-secondary', t.textSecondary);
  el.style.setProperty('--text-muted',     t.textMuted);
  el.style.setProperty('--text-title',     t.textPrimary);
  el.style.setProperty('--text-xs',   '0.75rem');
  el.style.setProperty('--text-sm',   '0.875rem');
  el.style.setProperty('--text-base', '1rem');
  el.style.setProperty('--text-lg',   '1.125rem');
  el.style.setProperty('--text-xl',   '1.375rem');
  el.style.setProperty('--text-2xl',  '1.75rem');
  el.style.setProperty('--text-3xl',  '2.5rem');
  el.style.setProperty('--accent',     t.accent);
  el.style.setProperty('--accent-rgb', t.accentRgb);
  el.style.setProperty('--accent-bg',  `rgba(${t.accentRgb},0.12)`);
  el.style.setProperty('--color-info', t.accent);
  el.style.setProperty('--dur-instant', '150ms');
  el.style.setProperty('--dur-fast',    '280ms');
  el.style.setProperty('--dur-base',    '380ms');
  el.style.setProperty('--dur-slow',    '520ms');
  el.style.setProperty('--dur-xslow',   '700ms');
  el.style.setProperty('--neutral-bubble',       'rgba(0,0,0,0.07)');
  el.style.setProperty('--neutral-bubble-faint', 'rgba(0,0,0,0.04)');
  el.style.setProperty('--neutral-hover',        'rgba(0,0,0,0.06)');
  el.style.setProperty('--glass',         t.surface);
  el.style.setProperty('--glass-border',  t.border);
  el.style.setProperty('--bg-secondary',  t.surface);
  el.style.setProperty('--bg-elevated',   t.surfaceHover);
  el.style.setProperty('--border-subtle', t.border);
  el.style.setProperty('--border-color',  t.border);
  el.style.setProperty('--border-strong', 'rgba(255,255,255,0.55)');
  el.style.setProperty('--input-bg',       'rgba(255,255,255,0.55)');
  el.style.setProperty('--input-bg-focus', 'rgba(255,255,255,0.80)');
  el.style.setProperty('--input-border',   'rgba(0,0,0,0.12)');
  el.style.filter = '';
}

// ── Context (kept for API compatibility) ─────────────────────────────
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
