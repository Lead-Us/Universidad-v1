import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import {
  RiBookOpenLine, RiMailLine, RiLockPasswordLine,
  RiUserLine, RiArrowLeftLine, RiEyeLine, RiEyeOffLine,
  RiUserSmileLine, RiBuilding2Line, RiGraduationCapLine,
} from 'react-icons/ri';
import styles from './Register.module.css';

const UNIVERSIDADES = [
  'Universidad de los Andes',
  'Universidad Adolfo Ibáñez',
  'Universidad Católica',
  'FEN - Universidad de Chile',
  'Universidad del Desarrollo',
  'Otra',
];

const ANOS = ['1°', '2°', '3°', '4°', '5°', '6° o más', 'Magíster'];

function generateUsername(nombre, apellido1, apellido2) {
  const clean = s => (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
  const p1 = clean(nombre).slice(0, 3);
  const p2 = clean(apellido1);
  const p3 = clean(apellido2).slice(0, 3);
  if (!p1 && !p2) return '';
  return [p1, p2, p3].filter(Boolean).join('.');
}

export default function Register() {
  const navigate    = useNavigate();
  const { signUp }  = useAuth();

  const [form, setForm] = useState({
    nombre:      '',
    apellido1:   '',
    apellido2:   '',
    email:       '',
    password:    '',
    username:    '',
    universidad: '',
    ano:         '',
  });
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  // Auto-generate username when name fields change
  useEffect(() => {
    const generated = generateUsername(form.nombre, form.apellido1, form.apellido2);
    setForm(f => ({ ...f, username: generated }));
  }, [form.nombre, form.apellido1, form.apellido2]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.nombre.trim())    return setError('Ingresa tu nombre.');
    if (!form.apellido1.trim()) return setError('Ingresa tu primer apellido.');
    if (!form.email.trim())     return setError('Ingresa tu correo.');
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (!form.universidad)      return setError('Selecciona tu universidad.');
    if (!form.ano)              return setError('Selecciona tu año de estudio.');

    setLoading(true);
    try {
      const data = await signUp({
        email:      form.email.trim(),
        password:   form.password,
        name:       form.nombre.trim(),
        apellido1:  form.apellido1.trim(),
        apellido2:  form.apellido2.trim(),
        username:   form.username || form.email.split('@')[0],
        university: form.universidad,
        studyYear:  form.ano,
      });
      if (data?.user && !data?.session) {
        setSuccess(true);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('already registered')) setError('Este correo ya tiene una cuenta.');
      else if (msg.includes('Password should be')) setError('La contraseña debe tener al menos 6 caracteres.');
      else setError(msg || 'Error al crear la cuenta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.wrap}>
        <div className={styles.blob1} /><div className={styles.blob2} />
        <div className={styles.card}>
          <div className={styles.successIcon}>✉️</div>
          <h2 className={styles.successTitle}>¡Revisa tu correo!</h2>
          <p className={styles.successText}>
            Te enviamos un enlace de confirmación a <strong>{form.email}</strong>.
            Confirma tu email para continuar con el pago y acceder a la plataforma.
          </p>
          <button className={styles.backBtn} onClick={() => navigate('/login')}>
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <div className={styles.card}>
        {/* Header */}
        <button className={styles.backLink} onClick={() => navigate('/')}>
          <RiArrowLeftLine /> Volver
        </button>

        <div className={styles.header}>
          <div className={styles.logoIcon}><RiBookOpenLine /></div>
          <h1 className={styles.title}>Crear cuenta</h1>
          <p className={styles.subtitle}>Accede a la plataforma académica con IA</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Nombre + Apellido 1 */}
          <div className={styles.row}>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Nombre</label>
              <div className={styles.field}>
                <RiUserLine className={styles.fieldIcon} />
                <input
                  type="text"
                  placeholder="Ernesto"
                  value={form.nombre}
                  onChange={set('nombre')}
                  autoComplete="given-name"
                  required
                />
              </div>
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Primer apellido</label>
              <div className={styles.field}>
                <RiUserLine className={styles.fieldIcon} />
                <input
                  type="text"
                  placeholder="Aguirre"
                  value={form.apellido1}
                  onChange={set('apellido1')}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Apellido 2 */}
          <div className={styles.fieldWrap}>
            <label className={styles.label}>Segundo apellido <span className={styles.optional}>(opcional)</span></label>
            <div className={styles.field}>
              <RiUserLine className={styles.fieldIcon} />
              <input
                type="text"
                placeholder="Henríquez"
                value={form.apellido2}
                onChange={set('apellido2')}
                autoComplete="additional-name"
              />
            </div>
          </div>

          {/* Username (auto-generated, editable) */}
          <div className={styles.fieldWrap}>
            <label className={styles.label}>
              Nombre de usuario
              {form.username && <span className={styles.autoTag}>generado automáticamente</span>}
            </label>
            <div className={styles.field}>
              <RiUserSmileLine className={styles.fieldIcon} />
              <input
                type="text"
                placeholder="ern.aguirre.hen"
                value={form.username}
                onChange={set('username')}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Email */}
          <div className={styles.fieldWrap}>
            <label className={styles.label}>Correo electrónico</label>
            <div className={styles.field}>
              <RiMailLine className={styles.fieldIcon} />
              <input
                type="email"
                placeholder="correo@universidad.cl"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.fieldWrap}>
            <label className={styles.label}>Contraseña</label>
            <div className={styles.field}>
              <RiLockPasswordLine className={styles.fieldIcon} />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
                minLength={6}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPwd(v => !v)}
                tabIndex={-1}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPwd ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            </div>
          </div>

          {/* Universidad + Año */}
          <div className={styles.row}>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Universidad</label>
              <div className={styles.field}>
                <RiBuilding2Line className={styles.fieldIcon} />
                <select value={form.universidad} onChange={set('universidad')} required>
                  <option value="">Seleccionar…</option>
                  {UNIVERSIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.label}>Año de estudio</label>
              <div className={styles.field}>
                <RiGraduationCapLine className={styles.fieldIcon} />
                <select value={form.ano} onChange={set('ano')} required>
                  <option value="">Seleccionar…</option>
                  {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>

          <p className={styles.loginLink}>
            ¿Ya tienes cuenta?{' '}
            <button type="button" className={styles.loginBtn} onClick={() => navigate('/login')}>
              Iniciar sesión
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
