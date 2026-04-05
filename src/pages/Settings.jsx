import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiUserLine, RiPaletteLine, RiRefreshLine, RiCheckLine, RiFolderUploadLine, RiArrowRightSLine, RiLogoutBoxLine } from 'react-icons/ri';
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
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signOut(); } finally { setSigningOut(false); }
  };

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

          <Section icon={RiFolderUploadLine} title="Importar">
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Importa tus archivos y syllabus para poblar tus ramos automáticamente.
            </p>
            <button className={styles.aprenderBtn} onClick={() => navigate('/importar')}>
              <RiFolderUploadLine />
              <span>Ir a Importar</span>
              <RiArrowRightSLine className={styles.aprenderArrow} />
            </button>
          </Section>

          {/* Cerrar sesión */}
          <Section icon={RiLogoutBoxLine} title="Sesión">
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Cierra sesión en este dispositivo.
            </p>
            <button
              className={styles.signOutBtn}
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <RiLogoutBoxLine />
              {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </Section>
        </div>

      </div>
    </div>
  );
}
