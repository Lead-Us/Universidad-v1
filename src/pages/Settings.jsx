import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiUserLine, RiCheckLine, RiFolderUploadLine, RiArrowRightSLine,
  RiLogoutBoxLine, RiUserAddLine, RiBuilding2Line, RiGraduationCapLine,
} from 'react-icons/ri';
import { useAuth } from '../lib/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
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
    study_year: profile?.study_year ?? '',
    email:      user?.email         ?? '',
  });
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateProfile({
        name:       form.name.trim(),
        apellido1:  form.apellido1.trim(),
        apellido2:  form.apellido2.trim(),
        university: form.university,
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
              <select className={styles.inputSelect} value={form.university} onChange={set('university')}>
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

function FreeAccessSection() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState('');
  const [isErr,   setIsErr]   = useState(false);

  const handleGrant = async (e) => {
    e.preventDefault();
    setMsg(''); setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No hay sesión activa.');

      const res = await fetch('/api/grant-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error del servidor.');
      setMsg(data.message);
      setIsErr(false);
      setEmail('');
    } catch (err) {
      setMsg(err.message);
      setIsErr(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section icon={RiUserAddLine} title="Acceso gratuito">
      <p className={styles.sectionDesc}>
        Ingresa el email de un amigo que ya creó su cuenta para darle acceso gratuito.
      </p>
      <form onSubmit={handleGrant} className={styles.freeForm}>
        <input
          className={styles.input}
          type="email"
          placeholder="amigo@email.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setMsg(''); }}
          required
          disabled={loading}
        />
        <button className={styles.saveBtn} type="submit" disabled={loading || !email.trim()}>
          {loading ? 'Verificando…' : 'Dar acceso gratuito'}
        </button>
      </form>
      {msg && (
        <p className={isErr ? styles.freeError : styles.freeSuccess}>{msg}</p>
      )}
      <p className={styles.freeNote}>
        El amigo debe crear su cuenta en la landing primero. Luego tú introduces su email aquí.
      </p>
    </Section>
  );
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const ADMIN_EMAIL = 'ernesto.aguirre.h@gmail.com';
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

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

          {isAdmin && <FreeAccessSection />}

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
