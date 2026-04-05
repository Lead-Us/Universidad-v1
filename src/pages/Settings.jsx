import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiUserLine, RiCheckLine, RiFolderUploadLine, RiArrowRightSLine,
  RiLogoutBoxLine, RiUserAddLine, RiBuilding2Line, RiGraduationCapLine,
  RiDeleteBinLine, RiRefreshLine,
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

async function apiCall(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('No hay sesión activa.');
  const res  = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers ?? {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor.');
  return data;
}

function FreeAccessSection() {
  const [email,    setEmail]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState('');
  const [isErr,    setIsErr]    = useState(false);
  const [users,    setUsers]    = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [isAdmin,  setIsAdmin]  = useState(null); // null=checking, true=admin, false=not

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await apiCall('/api/grant-free');
      setUsers(data.users ?? []);
      setIsAdmin(true);
    } catch (e) {
      // 401/403 → not admin, hide section
      if (e.message?.includes('administrador') || e.message?.includes('autenticado') || e.message?.includes('Token')) {
        setIsAdmin(false);
      } else {
        setIsAdmin(true); // admin but other error (e.g. 500), still show panel
      }
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  if (isAdmin === false) return null;
  if (isAdmin === null)  return null; // still checking

  const handleGrant = async (e) => {
    e.preventDefault();
    setMsg(''); setLoading(true);
    try {
      const data = await apiCall('/api/grant-free', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setMsg(data.message);
      setIsErr(false);
      setEmail('');
      await loadList();
    } catch (err) {
      setMsg(err.message);
      setIsErr(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (targetEmail) => {
    setRevoking(targetEmail);
    try {
      const data = await apiCall('/api/grant-free', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail, action: 'revoke' }),
      });
      setMsg(data.message);
      setIsErr(false);
      await loadList();
    } catch (err) {
      setMsg(err.message);
      setIsErr(true);
    } finally {
      setRevoking(null);
    }
  };

  return (
    <Section icon={RiUserAddLine} title="Acceso gratuito">
      <div className={styles.freeForm}>
        <form onSubmit={handleGrant} className={styles.freeInputRow}>
          <input
            className={styles.input}
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setMsg(''); }}
            required
            disabled={loading}
          />
          <button className={styles.saveBtn} type="submit" disabled={loading || !email.trim()}>
            {loading ? 'Verificando…' : 'Dar acceso'}
          </button>
        </form>

        {msg && (
          <p className={isErr ? styles.freeError : styles.freeSuccess}>{msg}</p>
        )}
      </div>

      {/* Lista de usuarios con acceso gratuito */}
      <div className={styles.freeListHeader}>
        <span className={styles.freeListTitle}>Con acceso gratuito</span>
        <button
          className={styles.freeRefreshBtn}
          onClick={loadList}
          disabled={loadingList}
          title="Actualizar lista"
          type="button"
        >
          <RiRefreshLine className={loadingList ? styles.freeSpinner : ''} />
        </button>
      </div>

      {loadingList ? (
        <p className={styles.freeListEmpty}>Cargando…</p>
      ) : users.length === 0 ? (
        <p className={styles.freeListEmpty}>Ningún usuario con acceso gratuito aún.</p>
      ) : (
        <ul className={styles.freeList}>
          {users.map(u => (
            <li key={u.id} className={styles.freeListItem}>
              <div className={styles.freeUserInfo}>
                <span className={styles.freeUserEmail}>{u.email}</span>
                {u.name && <span className={styles.freeUserName}>{u.name}</span>}
              </div>
              <button
                className={styles.freeRevokeBtn}
                onClick={() => handleRevoke(u.email)}
                disabled={revoking === u.email}
                title="Revocar acceso"
                type="button"
              >
                {revoking === u.email ? '…' : <RiDeleteBinLine />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export default function Settings() {
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
        </div>

        <div className={styles.grid}>
          <ProfileSection />

          <FreeAccessSection />

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
