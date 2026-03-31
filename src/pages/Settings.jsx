import { useState } from 'react';
import { RiUserLine, RiPaletteLine, RiRefreshLine, RiCheckLine } from 'react-icons/ri';
import { useAuth } from '../lib/AuthContext.jsx';
import {
  useSettings,
  BG_PRESETS, GLASS_PRESETS, ACCENT_PRESETS, BLUR_PRESETS, SPEED_PRESETS, FONT_COLOR_PRESETS,
  FONT_SIZE_PRESETS, TITLE_COLOR_PRESETS,
} from '../lib/SettingsContext.jsx';
import styles from './Settings.module.css';

// ── Section wrapper ──────────────────────────────────────────────────
function Section({ icon: Icon, title, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Icon className={styles.sectionIcon} />
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

// ── Preset picker ────────────────────────────────────────────────────
function PresetPicker({ label, presets, value, onChange, renderPreset }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.presetRow}>
        {presets.map(p => (
          <button
            key={p.id}
            className={[styles.presetBtn, value === p.id ? styles.presetActive : ''].join(' ')}
            onClick={() => onChange(p.id)}
            title={p.label}
          >
            {renderPreset ? renderPreset(p) : p.label}
            {value === p.id && <RiCheckLine className={styles.presetCheck} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Profile form ─────────────────────────────────────────────────────
function ProfileSection() {
  const { user } = useAuth();
  const [name,    setName]    = useState(user?.name    ?? '');
  const [email,   setEmail]   = useState(user?.email   ?? '');
  const [saved,   setSaved]   = useState(false);

  const handleSave = () => {
    // With real Supabase: supabase.auth.updateUser({ data: { name } })
    // For now, just show confirmation
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Section icon={RiUserLine} title="Perfil">
      <div className={styles.profileForm}>
        <div>
          <label className={styles.inputLabel}>Nombre</label>
          <input
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label className={styles.inputLabel}>Email</label>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </div>
        <button
          className={[styles.saveBtn, saved ? styles.saveBtnDone : ''].join(' ')}
          onClick={handleSave}
        >
          {saved ? <><RiCheckLine /> Guardado</> : 'Guardar cambios'}
        </button>
      </div>
    </Section>
  );
}

// ── Main Settings page ───────────────────────────────────────────────
export default function Settings() {
  const { settings, update, reset } = useSettings();

  return (
    <div className="page">
      <div className="page-content">

        <div className="section-header">
          <h1 className="section-title">Configuración</h1>
          <button className={styles.resetBtn} onClick={reset} title="Restablecer valores por defecto">
            <RiRefreshLine /> Restablecer
          </button>
        </div>

        <div className={styles.grid}>

          {/* Profile */}
          <ProfileSection />

          {/* Appearance */}
          <Section icon={RiPaletteLine} title="Apariencia">
            <div className={styles.appearanceForm}>

              {/* Background */}
              <PresetPicker
                label="Fondo de página"
                presets={BG_PRESETS}
                value={settings.bgPreset}
                onChange={v => update('bgPreset', v)}
                renderPreset={p => (
                  <span className={styles.bgSwatchWrap}>
                    <span className={styles.bgSwatch} style={{ background: p.value }} />
                    <span className={styles.bgSwatchLabel}>{p.label}</span>
                  </span>
                )}
              />

              {/* Glass intensity */}
              <PresetPicker
                label="Opacidad del vidrio"
                presets={GLASS_PRESETS}
                value={settings.glassPreset}
                onChange={v => update('glassPreset', v)}
              />

              {/* Accent */}
              <PresetPicker
                label="Color de acento"
                presets={ACCENT_PRESETS}
                value={settings.accentPreset}
                onChange={v => update('accentPreset', v)}
                renderPreset={p => (
                  <span className={styles.accentSwatch} style={{ background: p.value }} title={p.label} />
                )}
              />

              {/* Font color */}
              <PresetPicker
                label="Color de texto"
                presets={FONT_COLOR_PRESETS}
                value={settings.fontPreset}
                onChange={v => update('fontPreset', v)}
                renderPreset={p => (
                  <span className={styles.fontPresetBtn} title={p.label}>
                    {p.id === 'auto' ? 'Auto' : (
                      <span style={{ color: p.primary, fontWeight: 700, fontSize: 13 }}>Aa</span>
                    )}
                  </span>
                )}
              />

              {/* Title color */}
              <PresetPicker
                label="Color de títulos"
                presets={TITLE_COLOR_PRESETS}
                value={settings.titleColorPreset}
                onChange={v => update('titleColorPreset', v)}
                renderPreset={p => (
                  <span className={styles.fontPresetBtn} title={p.label}>
                    {p.id === 'auto' ? 'Auto' : <span style={{ fontWeight: 700, fontSize: 13 }}>H1</span>}
                  </span>
                )}
              />

              {/* Blur */}
              <PresetPicker
                label="Intensidad blur"
                presets={BLUR_PRESETS}
                value={settings.blurPreset}
                onChange={v => update('blurPreset', v)}
              />

              {/* Font size */}
              <PresetPicker
                label="Tamaño de texto"
                presets={FONT_SIZE_PRESETS}
                value={settings.fontSizePreset}
                onChange={v => update('fontSizePreset', v)}
              />

              {/* Speed */}
              <PresetPicker
                label="Velocidad de animaciones"
                presets={SPEED_PRESETS}
                value={settings.speedPreset}
                onChange={v => update('speedPreset', v)}
              />

            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
