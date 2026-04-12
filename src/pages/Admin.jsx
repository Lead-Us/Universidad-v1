import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiShieldUserLine, RiUserAddLine, RiDeleteBinLine,
  RiRefreshLine, RiArrowLeftLine, RiCheckLine,
  RiUserLine, RiLockPasswordLine, RiMailLine,
} from 'react-icons/ri';
import { supabase } from '../lib/supabase.js';
import styles from './Admin.module.css';

async function apiCall(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('No hay sesión activa.');
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor.');
  return data;
}

export default function Admin() {
  const navigate = useNavigate();

  const [status,      setStatus]      = useState('loading');
  const [users,       setUsers]       = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Grant access state
  const [grantEmail,  setGrantEmail]  = useState('');
  const [granting,    setGranting]    = useState(false);
  const [grantMsg,    setGrantMsg]    = useState('');
  const [grantErr,    setGrantErr]    = useState(false);

  // Create account state
  const [newEmail,    setNewEmail]    = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName,     setNewName]     = useState('');
  const [creating,    setCreating]    = useState(false);
  const [createMsg,   setCreateMsg]   = useState('');
  const [createErr,   setCreateErr]   = useState(false);

  const [revoking,    setRevoking]    = useState(null);

  const loadUsers = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await apiCall('/api/grant-free');
      setUsers(data.users ?? []);
      setStatus('authorized');
    } catch (e) {
      const forbidden =
        e.message?.includes('administrador') ||
        e.message?.includes('autenticado') ||
        e.message?.includes('Token') ||
        e.message?.includes('Solo el');
      setStatus(forbidden ? 'forbidden' : 'authorized');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleGrant = async (e) => {
    e.preventDefault();
    setGrantMsg(''); setGranting(true);
    try {
      const data = await apiCall('/api/grant-free', {
        method: 'POST',
        body: JSON.stringify({ email: grantEmail.trim() }),
      });
      setGrantMsg(data.message);
      setGrantErr(false);
      setGrantEmail('');
      await loadUsers();
    } catch (err) {
      setGrantMsg(err.message);
      setGrantErr(true);
    } finally {
      setGranting(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateMsg(''); setCreating(true);
    try {
      const data = await apiCall('/api/create-account', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail.trim(), password: newPassword, name: newName.trim() }),
      });
      setCreateMsg(data.message);
      setCreateErr(false);
      setNewEmail(''); setNewPassword(''); setNewName('');
      await loadUsers();
    } catch (err) {
      setCreateMsg(err.message);
      setCreateErr(true);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (targetEmail) => {
    setRevoking(targetEmail);
    try {
      await apiCall('/api/grant-free', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail, action: 'revoke' }),
      });
      await loadUsers();
    } catch (err) {
      console.error(err.message);
    } finally {
      setRevoking(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className={styles.centeredWrap}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div className={styles.centeredWrap}>
        <div className={styles.forbiddenCard}>
          <RiShieldUserLine className={styles.forbiddenIcon} />
          <h2 className={styles.forbiddenTitle}>Acceso restringido</h2>
          <p className={styles.forbiddenSub}>Esta sección es solo para administradores.</p>
          <button className={styles.backBtnLarge} onClick={() => navigate('/')}>
            <RiArrowLeftLine /> Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-content">

        {/* ── Page header ── */}
        <div className={styles.pageHeader}>
          <button className={styles.backBtn} onClick={() => navigate('/settings')}>
            <RiArrowLeftLine /> Configuración
          </button>
          <div className={styles.headerMeta}>
            <span className={styles.adminBadge}>
              <RiShieldUserLine /> Admin
            </span>
            <h1 className={styles.pageTitle}>Panel de administración</h1>
            <p className={styles.pageSubtitle}>Gestiona usuarios y acceso a la plataforma</p>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{users.length}</span>
            <span className={styles.statLabel}>Con acceso gratuito</span>
          </div>
        </div>

        {/* ── Two-column grid ── */}
        <div className={styles.grid}>

          {/* Left column: Create account + Grant access */}
          <div className={styles.leftCol}>

            {/* Create full account card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderInner}>
                  <div className={styles.cardIconWrap} style={{ background: 'rgba(124,58,237,0.10)' }}>
                    <RiUserAddLine className={styles.cardIcon} />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Crear cuenta completa</h2>
                    <p className={styles.cardSub}>Crea un usuario nuevo con acceso gratuito</p>
                  </div>
                </div>
              </div>
              <div className={styles.cardBody}>
                <form onSubmit={handleCreate} className={styles.grantForm}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Nombre (opcional)</label>
                    <div className={styles.inputWrap}>
                      <RiUserLine className={styles.inputIcon} />
                      <input
                        className={styles.input}
                        type="text"
                        placeholder="Nombre del usuario"
                        value={newName}
                        onChange={e => { setNewName(e.target.value); setCreateMsg(''); }}
                        disabled={creating}
                      />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Correo electrónico</label>
                    <div className={styles.inputWrap}>
                      <RiMailLine className={styles.inputIcon} />
                      <input
                        className={styles.input}
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={newEmail}
                        onChange={e => { setNewEmail(e.target.value); setCreateMsg(''); }}
                        required
                        disabled={creating}
                      />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Contraseña</label>
                    <div className={styles.inputWrap}>
                      <RiLockPasswordLine className={styles.inputIcon} />
                      <input
                        className={styles.input}
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); setCreateMsg(''); }}
                        required
                        minLength={8}
                        disabled={creating}
                      />
                    </div>
                  </div>
                  <button
                    className={styles.primaryBtn}
                    type="submit"
                    disabled={creating || !newEmail.trim() || !newPassword}
                  >
                    {creating ? 'Creando cuenta…' : <><RiUserAddLine /> Crear cuenta y dar acceso</>}
                  </button>
                </form>
                {createMsg && (
                  <p className={createErr ? styles.msgErr : styles.msgOk}>
                    {!createErr && <RiCheckLine />} {createMsg}
                  </p>
                )}
              </div>
            </div>

            {/* Grant existing user card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderInner}>
                  <div className={styles.cardIconWrap} style={{ background: 'rgba(16,185,129,0.10)' }}>
                    <RiShieldUserLine className={styles.cardIcon} style={{ color: 'var(--color-success)' }} />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Dar acceso gratuito</h2>
                    <p className={styles.cardSub}>A un usuario que ya tiene cuenta</p>
                  </div>
                </div>
              </div>
              <div className={styles.cardBody}>
                <form onSubmit={handleGrant} className={styles.grantForm}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Correo electrónico</label>
                    <div className={styles.inputWrap}>
                      <RiMailLine className={styles.inputIcon} />
                      <input
                        className={styles.input}
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={grantEmail}
                        onChange={e => { setGrantEmail(e.target.value); setGrantMsg(''); }}
                        required
                        disabled={granting}
                      />
                    </div>
                  </div>
                  <button
                    className={styles.secondaryBtn}
                    type="submit"
                    disabled={granting || !grantEmail.trim()}
                  >
                    {granting ? 'Verificando…' : <><RiCheckLine /> Dar acceso</>}
                  </button>
                </form>
                {grantMsg && (
                  <p className={grantErr ? styles.msgErr : styles.msgOk}>
                    {!grantErr && <RiCheckLine />} {grantMsg}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Right column: User list */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderInner}>
                <div className={styles.cardIconWrap} style={{ background: 'rgba(0,0,0,0.06)' }}>
                  <RiUserLine className={styles.cardIcon} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Acceso gratuito activo</h2>
                  <p className={styles.cardSub}>{users.length} usuario{users.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                className={styles.refreshBtn}
                onClick={loadUsers}
                disabled={loadingList}
                type="button"
                title="Actualizar lista"
              >
                <RiRefreshLine className={loadingList ? styles.spinning : ''} />
              </button>
            </div>
            <div className={styles.cardBody}>
              {loadingList ? (
                <p className={styles.emptyText}>Cargando…</p>
              ) : users.length === 0 ? (
                <div className={styles.emptyState}>
                  <RiUserLine className={styles.emptyIcon} />
                  <p className={styles.emptyText}>Ningún usuario con acceso gratuito.</p>
                </div>
              ) : (
                <ul className={styles.userList}>
                  {users.map(u => (
                    <li key={u.id} className={styles.userRow}>
                      <div className={styles.avatar}>
                        {(u.email?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div className={styles.userInfo}>
                        <span className={styles.userEmail}>{u.email}</span>
                        {u.name && u.name !== '(sin nombre)' && (
                          <span className={styles.userName}>{u.name}</span>
                        )}
                      </div>
                      <span className={styles.freeBadge}>Gratis</span>
                      <button
                        className={styles.revokeBtn}
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
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
