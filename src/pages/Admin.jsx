import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiShieldUserLine, RiUserAddLine, RiDeleteBinLine,
  RiRefreshLine, RiArrowLeftLine, RiCheckLine,
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

  // 'loading' | 'authorized' | 'forbidden'
  const [status,      setStatus]      = useState('loading');
  const [users,       setUsers]       = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [email,       setEmail]       = useState('');
  const [granting,    setGranting]    = useState(false);
  const [revoking,    setRevoking]    = useState(null);
  const [msg,         setMsg]         = useState('');
  const [isErr,       setIsErr]       = useState(false);

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
    setMsg(''); setGranting(true);
    try {
      const data = await apiCall('/api/grant-free', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setMsg(data.message);
      setIsErr(false);
      setEmail('');
      await loadUsers();
    } catch (err) {
      setMsg(err.message);
      setIsErr(true);
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (targetEmail) => {
    setRevoking(targetEmail);
    setMsg('');
    try {
      const data = await apiCall('/api/grant-free', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail, action: 'revoke' }),
      });
      setMsg(data.message);
      setIsErr(false);
      await loadUsers();
    } catch (err) {
      setMsg(err.message);
      setIsErr(true);
    } finally {
      setRevoking(null);
    }
  };

  /* ── Loading ── */
  if (status === 'loading') {
    return (
      <div className={styles.centeredWrap}>
        <div className={styles.spinner} />
      </div>
    );
  }

  /* ── Forbidden ── */
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

  /* ── Authorized ── */
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
            <p className={styles.pageSubtitle}>
              Gestiona el acceso gratuito a la plataforma
            </p>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{users.length}</span>
            <span className={styles.statLabel}>Con acceso gratuito</span>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className={styles.grid}>

          {/* Grant card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderInner}>
                <RiUserAddLine className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>Dar acceso gratuito</h2>
              </div>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.desc}>
                El usuario debe tener cuenta registrada. Al otorgar acceso omite el flujo de pago y queda con estado <strong>free</strong>.
              </p>
              <form onSubmit={handleGrant} className={styles.grantForm}>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setMsg(''); }}
                  required
                  disabled={granting}
                />
                <button
                  className={styles.grantBtn}
                  type="submit"
                  disabled={granting || !email.trim()}
                >
                  {granting
                    ? 'Verificando…'
                    : <><RiUserAddLine /> Dar acceso</>
                  }
                </button>
              </form>
              {msg && (
                <p className={isErr ? styles.msgErr : styles.msgOk}>
                  {!isErr && <RiCheckLine />} {msg}
                </p>
              )}
            </div>
          </div>

          {/* Users card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderInner}>
                <RiShieldUserLine className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>Acceso gratuito activo</h2>
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
                  <RiShieldUserLine className={styles.emptyIcon} />
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
