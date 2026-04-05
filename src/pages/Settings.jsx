import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiUserLine, RiCheckLine, RiFolderUploadLine, RiArrowRightSLine,
  RiLogoutBoxLine, RiUserAddLine,
} from 'react-icons/ri';
import { useAuth } from '../lib/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
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
