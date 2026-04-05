import { useState } from 'react';
import { useAuth } from '../lib/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { RiBookOpenLine, RiMailLine, RiLockPasswordLine, RiUserLine, RiEyeLine, RiEyeOffLine, RiArrowLeftLine } from 'react-icons/ri';
import styles from './Login.module.css';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode,     setMode]     = useState('login'); // 'login' | 'register' | 'forgot'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'forgot') {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (resetErr) throw resetErr;
        setSuccess('Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.');
      } else if (mode === 'login') {
        await signIn(email, password);
      } else {
        if (!name.trim()) { setError('Por favor ingresa tu nombre.'); setLoading(false); return; }
        const { data } = await signUp(email, password, name.trim());
        if (data?.user && !data?.session) {
          setSuccess('¡Cuenta creada! Revisa tu correo para confirmar tu cuenta.');
        }
      }
    } catch (err) {
      const msg = err.message || 'Ocurrió un error. Intenta de nuevo.';
      if (msg.includes('Invalid login credentials')) setError('Correo o contraseña incorrectos.');
      else if (msg.includes('already registered')) setError('Este correo ya tiene una cuenta. Inicia sesión.');
      else if (msg.includes('Password should be')) setError('La contraseña debe tener al menos 6 caracteres.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      {/* Background blobs */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      <div className={styles.blob3} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <RiBookOpenLine />
          </div>
          <h1 className={styles.logoText}>Universidad</h1>
          <p className={styles.logoSub}>Tu espacio académico personal</p>
        </div>

        {/* Mode toggle */}
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
          <div className={styles.toggle}>
            <button
              className={[styles.toggleBtn, mode === 'login' ? styles.toggleActive : ''].join(' ')}
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              type="button"
            >
              Iniciar sesión
            </button>
            <button
              className={[styles.toggleBtn, mode === 'register' ? styles.toggleActive : ''].join(' ')}
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
              type="button"
            >
              Crear cuenta
            </button>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className={styles.field}>
              <RiUserLine className={styles.fieldIcon} />
              <input
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className={styles.field}>
            <RiMailLine className={styles.fieldIcon} />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <RiLockPasswordLine className={styles.fieldIcon} />
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
              : mode === 'login'  ? 'Ingresar'
              : 'Crear cuenta'
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
      </div>
    </div>
  );
}
