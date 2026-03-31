import { useState } from 'react';
import { RiUserLine, RiPaletteLine, RiRefreshLine, RiCheckLine } from 'react-icons/ri';
import { useAuth } from '../lib/AuthContext.jsx';
import { useSettings, THEME_PRESETS } from '../lib/SettingsContext.jsx';
import styles from './Settings.module.css';

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

function ProfileSection() {
  const { user } = useAuth();
  const [name,  setName]  = useState(user?.name  ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Section icon={RiUserLine} title="Perfil">
      <div className={styles.profileForm}>
        <div>
          <label className={styles.inputLabel}>Nombre</label>
          <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
        </div>
        <div>
          <label className={styles.inputLabel}>Email</label>
          <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
        </div>
        <button className={[styles.saveBtn, saved ? styles.saveBtnDone : ''].join(' ')} onClick={handleSave}>
          {saved ? <><RiCheckLine /> Guardado</> : 'Guardar cambios'}
        </button>
      </div>
    </Section>
  );
}

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
          <ProfileSection />

          <Section icon={RiPaletteLine} title="Apariencia">
            <div className={styles.themeGrid}>
              {THEME_PRESETS.map(theme => (
                <button
                  key={theme.id}
                  className={[styles.themePill, settings.themePreset === theme.id ? styles.themeActive : ''].join(' ')}
                  onClick={() => update('themePreset', theme.id)}
                >
                  <span className={styles.themePreview} style={{ background: theme.gradient }} />
                  <span className={styles.themeLabel}>{theme.label}</span>
                  {settings.themePreset === theme.id && <RiCheckLine className={styles.themeCheck} />}
                </button>
              ))}
            </div>
          </Section>
        </div>

      </div>
    </div>
  );
}
