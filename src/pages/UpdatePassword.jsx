import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import styles from './Login.module.css';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [done,      setDone]      = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirm)  { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    setError('');

    const { error: err } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (err) { setError(err.message); return; }

    setDone(true);
    setTimeout(() => navigate('/', { replace: true }), 2000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Establecer contraseña</h1>
        <p className={styles.subtitle}>Elige una contraseña para tu cuenta.</p>

        {done ? (
          <p style={{ color: 'var(--accent)', textAlign: 'center', marginTop: '1rem' }}>
            ✓ Contraseña actualizada. Redirigiendo…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pw">Nueva contraseña</label>
              <input
                id="pw"
                type="password"
                className={styles.input}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pw2">Confirmar contraseña</label>
              <input
                id="pw2"
                type="password"
                className={styles.input}
                placeholder="Repite la contraseña"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
