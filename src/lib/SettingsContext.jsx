import { createContext, useContext, useEffect } from 'react';

// ── Dark minimal theme — indigo accent ────────────────────────────────────
function applyTheme() {
  const el = document.documentElement;

  el.style.setProperty('--lg-bg-gradient',   '#0a0a0a');
  el.style.setProperty('--bg-app',           '#0a0a0a');
  el.style.setProperty('--bg-app-pure',      '#0a0a0a');
  el.style.setProperty('--lg-surface',       '#111111');
  el.style.setProperty('--lg-surface-hover', '#181818');
  el.style.setProperty('--lg-surface-active','#1f1f1f');
  el.style.setProperty('--lg-surface-subtle','rgba(255,255,255,0.03)');
  el.style.setProperty('--lg-border',        '#222222');
  el.style.setProperty('--lg-border-bottom', 'rgba(255,255,255,0.06)');
  el.style.setProperty('--lg-border-dark',   'rgba(255,255,255,0.10)');
  el.style.setProperty('--lg-specular',      'rgba(255,255,255,0.06)');
  el.style.setProperty('--lg-shadow',        '0 2px 8px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.05)');
  el.style.setProperty('--lg-shadow-hover',  '0 8px 24px rgba(0,0,0,0.60), 0 2px 8px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.07)');
  el.style.setProperty('--lg-shadow-xs',     '0 1px 3px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.05)');
  el.style.setProperty('--lg-shadow-modal',  '0 20px 60px rgba(0,0,0,0.80), 0 8px 24px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.07)');
  el.style.setProperty('--lg-shadow-nav',    '1px 0 0 #1a1a1a, 4px 0 16px rgba(0,0,0,0.40)');
  el.style.setProperty('--lg-blur-base',     'none');
  el.style.setProperty('--blur-sm',          'none');
  el.style.setProperty('--blur-base',        'none');
  el.style.setProperty('--blur-lg',          'none');
  el.style.setProperty('--text-primary',     '#f0f0f0');
  el.style.setProperty('--text-secondary',   '#888888');
  el.style.setProperty('--text-muted',       '#555555');
  el.style.setProperty('--text-title',       '#f0f0f0');
  el.style.setProperty('--text-xs',   '0.75rem');
  el.style.setProperty('--text-sm',   '0.875rem');
  el.style.setProperty('--text-base', '1rem');
  el.style.setProperty('--text-lg',   '1.125rem');
  el.style.setProperty('--text-xl',   '1.375rem');
  el.style.setProperty('--text-2xl',  '1.75rem');
  el.style.setProperty('--text-3xl',  '2.25rem');
  el.style.setProperty('--accent',     '#6366f1');
  el.style.setProperty('--accent-rgb', '99,102,241');
  el.style.setProperty('--accent-bg',  'rgba(99,102,241,0.12)');
  el.style.setProperty('--accent-gradient', 'linear-gradient(135deg,#818cf8 0%,#4f46e5 100%)');
  el.style.setProperty('--color-success', '#34D399');
  el.style.setProperty('--color-danger',  '#F87171');
  el.style.setProperty('--color-warning', '#FBBF24');
  el.style.setProperty('--color-info',    '#60A5FA');
  el.style.setProperty('--dur-instant','120ms');
  el.style.setProperty('--dur-fast',   '180ms');
  el.style.setProperty('--dur-base',   '240ms');
  el.style.setProperty('--dur-slow',   '360ms');
  el.style.setProperty('--dur-xslow',  '500ms');
  el.style.setProperty('--neutral-bubble',       'rgba(255,255,255,0.06)');
  el.style.setProperty('--neutral-bubble-faint', 'rgba(255,255,255,0.03)');
  el.style.setProperty('--neutral-hover',        'rgba(255,255,255,0.04)');
  el.style.setProperty('--btn-bg',       'rgba(255,255,255,0.08)');
  el.style.setProperty('--btn-bg-hover', 'rgba(255,255,255,0.12)');
  el.style.setProperty('--btn-text',     '#f0f0f0');
  el.style.setProperty('--glass',         '#111111');
  el.style.setProperty('--glass-border',  '#222222');
  el.style.setProperty('--bg-secondary',  '#141414');
  el.style.setProperty('--bg-elevated',   '#1a1a1a');
  el.style.setProperty('--border-subtle', 'rgba(255,255,255,0.05)');
  el.style.setProperty('--border-color',  '#222222');
  el.style.setProperty('--border-strong', '#333333');
  el.style.setProperty('--input-bg',       '#141414');
  el.style.setProperty('--input-bg-focus', '#1a1a1a');
  el.style.setProperty('--input-border',   '#2a2a2a');
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
