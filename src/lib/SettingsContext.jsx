import { createContext, useContext, useEffect } from 'react';

// ── Dark minimal theme — high-contrast gray scale ─────────────────────────
function applyTheme() {
  const el = document.documentElement;

  // Backgrounds
  el.style.setProperty('--lg-bg-gradient',   '#0a0a0a');
  el.style.setProperty('--bg-app',           '#0a0a0a');
  el.style.setProperty('--bg-app-pure',      '#0a0a0a');
  el.style.setProperty('--bg-secondary',     '#161616');
  el.style.setProperty('--bg-elevated',      '#1e1e1e');

  // Surfaces
  el.style.setProperty('--lg-surface',        '#161616');
  el.style.setProperty('--lg-surface-hover',  '#1e1e1e');
  el.style.setProperty('--lg-surface-active', '#242424');
  el.style.setProperty('--lg-surface-subtle', 'rgba(255,255,255,0.02)');
  el.style.setProperty('--lg-surface-deep',   '#0d0d0d');
  el.style.setProperty('--glass',             '#161616');
  el.style.setProperty('--glass-strong',      '#1e1e1e');

  // Borders
  el.style.setProperty('--lg-border',         '#2a2a2a');
  el.style.setProperty('--lg-border-bottom',  '#2a2a2a');
  el.style.setProperty('--lg-border-dark',    '#333333');
  el.style.setProperty('--glass-border',      '#2a2a2a');
  el.style.setProperty('--glass-border-hover','#3a3a3a');
  el.style.setProperty('--border-subtle',     'rgba(255,255,255,0.05)');
  el.style.setProperty('--border-color',      '#2a2a2a');
  el.style.setProperty('--border-strong',     '#3a3a3a');
  el.style.setProperty('--input-border',      '#2a2a2a');

  // Shadows
  el.style.setProperty('--lg-shadow',        '0 1px 4px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.04)');
  el.style.setProperty('--lg-shadow-hover',  '0 6px 20px rgba(0,0,0,0.70), 0 0 0 1px rgba(255,255,255,0.06)');
  el.style.setProperty('--lg-shadow-xs',     '0 1px 2px rgba(0,0,0,0.50)');
  el.style.setProperty('--lg-shadow-modal',  '0 20px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)');
  el.style.setProperty('--lg-shadow-nav',    '1px 0 0 #1e1e1e');
  el.style.setProperty('--lg-specular',      'rgba(255,255,255,0.04)');

  // Text — high contrast
  el.style.setProperty('--text-primary',   '#ffffff');
  el.style.setProperty('--text-secondary', '#a0a0a0');
  el.style.setProperty('--text-muted',     '#666666');
  el.style.setProperty('--text-title',     '#ffffff');

  // Typography sizes
  el.style.setProperty('--text-xs',   '0.75rem');
  el.style.setProperty('--text-sm',   '0.875rem');
  el.style.setProperty('--text-base', '1rem');
  el.style.setProperty('--text-lg',   '1.125rem');
  el.style.setProperty('--text-xl',   '1.375rem');
  el.style.setProperty('--text-2xl',  '1.75rem');
  el.style.setProperty('--text-3xl',  '2.25rem');

  // Accent — indigo
  el.style.setProperty('--accent',          '#6366f1');
  el.style.setProperty('--accent-rgb',      '99,102,241');
  el.style.setProperty('--accent-bg',       'rgba(99,102,241,0.12)');
  el.style.setProperty('--accent-gradient', 'linear-gradient(135deg,#818cf8 0%,#4f46e5 100%)');

  // Semantic colors
  el.style.setProperty('--color-success', '#34D399');
  el.style.setProperty('--color-danger',  '#F87171');
  el.style.setProperty('--color-warning', '#FBBF24');
  el.style.setProperty('--color-info',    '#60A5FA');

  // Timing
  el.style.setProperty('--dur-instant','120ms');
  el.style.setProperty('--dur-fast',   '180ms');
  el.style.setProperty('--dur-base',   '240ms');
  el.style.setProperty('--dur-slow',   '360ms');
  el.style.setProperty('--dur-xslow',  '500ms');

  // Neutrals
  el.style.setProperty('--neutral-bubble',       'rgba(255,255,255,0.05)');
  el.style.setProperty('--neutral-bubble-faint', 'rgba(255,255,255,0.02)');
  el.style.setProperty('--neutral-hover',        'rgba(255,255,255,0.04)');

  // Buttons — white primary, dark secondary
  el.style.setProperty('--btn-bg',       '#ffffff');
  el.style.setProperty('--btn-bg-hover', '#e8e8e8');
  el.style.setProperty('--btn-text',     '#000000');

  // Inputs
  el.style.setProperty('--input-bg',       '#161616');
  el.style.setProperty('--input-bg-focus', '#1e1e1e');

  // Blur
  el.style.setProperty('--lg-blur-base', 'none');
  el.style.setProperty('--blur-sm',      'none');
  el.style.setProperty('--blur-base',    'none');
  el.style.setProperty('--blur-lg',      'none');
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
