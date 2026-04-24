import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { RiBookOpenLine, RiUserLine, RiMailLine, RiLockPasswordLine, RiEyeLine, RiEyeOffLine, RiArrowLeftLine } from 'react-icons/ri';
import styles from './Login.module.css';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [mode,     setMode]     = useState('login'); // 'login' | 'forgot'
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const isEmail = identifier.includes('@');

  // Resolve username → email via secure RPC (works unauthenticated)
  const resolveEmail = async () => {
    if (isEmail) return identifier.trim();
    const { data, error } = await supabase.rpc('resolve_login_identifier', {
      p_identifier: identifier.trim(),
    });
    if (error || !data) throw new Error('Usuario no encontrado.');
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'forgot') {
        const resolvedEmail = await resolveEmail();
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resolvedEmail, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (resetErr) throw resetErr;
        setSuccess('Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.');
      } else {
        const resolvedEmail = await resolveEmail();
        await signIn(resolvedEmail, password);
      }
    } catch (err) {
      const msg = err.message || 'Ocurrió un error. Intenta de nuevo.';
      if (msg.includes('Invalid login credentials')) setError('Correo o contraseña incorrectos.');
      else if (msg.includes('Password should be')) setError('La contraseña debe tener al menos 6 caracteres.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <RiBookOpenLine />
          </div>
          <h1 className={styles.logoText}>Universidad</h1>
          <p className={styles.logoSub}>Tu espacio académico personal</p>
        </div>

        {mode === 'forgot' ? (
          <div className={styles.forgotHeader}>
            <button
              type="button"
              className={styles.backLink}
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            >
              <RiArrowLeftLine /> Volver
            </button>
            <p className={styles.forgotTitle}>Recuperar contraseña</p>
          </div>
        ) : (
          <p className={styles.modeTitle}>Iniciar sesión</p>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            {isEmail ? <RiMailLine className={styles.fieldIcon} /> : <RiUserLine className={styles.fieldIcon} />}
            <input
              type="text"
              placeholder={mode === 'forgot' ? 'Correo o nombre de usuario' : 'Correo o nombre de usuario'}
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          {mode === 'login' && (
            <div className={styles.field}>
              <RiLockPasswordLine className={styles.fieldIcon} />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                minLength={6}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPwd(v => !v)}
                tabIndex={-1}
              >
                {showPwd ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            </div>
          )}

          {error   && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading
              ? 'Cargando…'
              : mode === 'forgot' ? 'Enviar enlace'
              : 'Ingresar'
            }
          </button>

          {mode === 'login' && (
            <button
              type="button"
              className={styles.forgotLink}
              onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </form>

        <p className={styles.registerLink}>
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            className={styles.registerBtn}
            onClick={() => navigate('/register')}
          >
            Crear cuenta
          </button>
        </p>
      </div>
    </div>
  );
}
