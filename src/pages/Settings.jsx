import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiUserLine, RiCheckLine, RiFolderUploadLine, RiArrowRightSLine,
  RiLogoutBoxLine, RiShieldUserLine, RiBuilding2Line, RiGraduationCapLine,
} from 'react-icons/ri';
import { useAuth } from '../lib/AuthContext.jsx';
import styles from './Settings.module.css';

const UNIVERSIDADES = [
  'Universidad de los Andes',
  'Universidad Adolfo Ibáñez',
  'Universidad Católica',
  'FEN - Universidad de Chile',
  'Universidad del Desarrollo',
  'Otra',
];

const ANOS = ['1°', '2°', '3°', '4°', '5°', '6° o más', 'Magíster'];

const CARRERAS = {
  'Universidad de los Andes':   ['Ingeniería Comercial', 'Derecho', 'Medicina', 'Psicología', 'Ingeniería Civil Industrial', 'Ingeniería en Computación', 'Otra'],
  'Universidad Adolfo Ibáñez':  ['Ingeniería Comercial', 'Ingeniería Civil Industrial', 'Derecho', 'Psicología', 'Ingeniería en Información y Control de Gestión', 'Otra'],
  'Universidad Católica':       ['Ingeniería Civil', 'Ingeniería Comercial', 'Derecho', 'Medicina', 'Arquitectura', 'Psicología', 'Educación', 'Otra'],
  'FEN - Universidad de Chile': ['Ingeniería Comercial', 'Contador Auditor', 'Economía', 'Otra'],
  'Universidad del Desarrollo': ['Ingeniería Comercial', 'Derecho', 'Medicina', 'Psicología', 'Diseño', 'Ingeniería Civil', 'Otra'],
  'Otra':                       ['Ingeniería', 'Derecho', 'Medicina', 'Psicología', 'Administración', 'Educación', 'Arte y Diseño', 'Ciencias', 'Otra'],
};

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
  const { user, profile, updateProfile } = useAuth();

  const [form, setForm] = useState({
    name:       profile?.name       ?? '',
    apellido1:  profile?.apellido1  ?? '',
    apellido2:  profile?.apellido2  ?? '',
    university: profile?.university ?? '',
    carrera:    profile?.carrera    ?? '',
    study_year: profile?.study_year ?? '',
    email:      user?.email         ?? '',
  });
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleUniversity = (e) => setForm(f => ({ ...f, university: e.target.value, carrera: '' }));

  const carrerasDisponibles = CARRERAS[form.university] ?? [];

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateProfile({
        name:       form.name.trim(),
        apellido1:  form.apellido1.trim(),
        apellido2:  form.apellido2.trim(),
        university: form.university,
        carrera:    form.carrera,
        study_year: form.study_year,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section icon={RiUserLine} title="Perfil">
      <div className={styles.profileForm}>
        <div className={styles.profileRow}>
          <div>
            <label className={styles.inputLabel}>Nombre</label>
            <input className={styles.input} value={form.name} onChange={set('name')} placeholder="Tu nombre" />
          </div>
          <div>
            <label className={styles.inputLabel}>Primer apellido</label>
            <input className={styles.input} value={form.apellido1} onChange={set('apellido1')} placeholder="Apellido" />
          </div>
        </div>

        <div>
          <label className={styles.inputLabel}>Segundo apellido <span className={styles.optionalTag}>(opcional)</span></label>
          <input className={styles.input} value={form.apellido2} onChange={set('apellido2')} placeholder="Segundo apellido" />
        </div>

        <div className={styles.profileRow}>
          <div>
            <label className={styles.inputLabel}>Universidad</label>
            <div className={styles.selectWrap}>
              <RiBuilding2Line className={styles.selectIcon} />
              <select className={styles.inputSelect} value={form.university} onChange={handleUniversity}>
                <option value="">Seleccionar…</option>
                {UNIVERSIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={styles.inputLabel}>Año de estudio</label>
            <div className={styles.selectWrap}>
              <RiGraduationCapLine className={styles.selectIcon} />
              <select className={styles.inputSelect} value={form.study_year} onChange={set('study_year')}>
                <option value="">Seleccionar…</option>
                {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className={styles.inputLabel}>Carrera <span className={styles.optionalTag}>(opcional)</span></label>
          <div className={styles.selectWrap}>
            <RiGraduationCapLine className={styles.selectIcon} />
            <select
              className={styles.inputSelect}
              value={form.carrera}
              onChange={set('carrera')}
              disabled={carrerasDisponibles.length === 0}
            >
              <option value="">{form.university ? 'Seleccionar…' : 'Selecciona una universidad primero'}</option>
              {carrerasDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={styles.inputLabel}>Correo electrónico</label>
          <input className={styles.input} type="email" value={form.email} disabled style={{ opacity: 0.6 }} />
        </div>

        {error && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)', margin: 0 }}>{error}</p>}

        <button
          className={[styles.saveBtn, saved ? styles.saveBtnDone : ''].join(' ')}
          onClick={handleSave}
          disabled={saving}
        >
          {saved ? <><RiCheckLine /> Guardado</> : saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </Section>
  );
}

export default function Settings() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.app_metadata?.role === 'admin';
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
        </div>

        <div className={styles.grid}>
          <ProfileSection />

          {isAdmin && (
            <Section icon={RiShieldUserLine} title="Administración">
              <p className={styles.sectionDesc}>
                Panel de administración para gestionar accesos y usuarios de la plataforma.
              </p>
              <button className={styles.aprenderBtn} onClick={() => navigate('/admin')}>
                <RiShieldUserLine />
                <span>Ir al panel admin</span>
                <RiArrowRightSLine className={styles.aprenderArrow} />
              </button>
            </Section>
          )}

          <Section icon={RiFolderUploadLine} title="Importar">
            <p className={styles.sectionDesc}>
              Importa tus archivos y syllabus para poblar tus ramos automáticamente.
            </p>
            <button className={styles.aprenderBtn} onClick={() => navigate('/importar')}>
              <RiFolderUploadLine />
              <span>Ir a Importar</span>
              <RiArrowRightSLine className={styles.aprenderArrow} />
            </button>
          </Section>

          <Section icon={RiLogoutBoxLine} title="Sesión">
            <p className={styles.sectionDesc}>Cierra sesión en este dispositivo.</p>
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
