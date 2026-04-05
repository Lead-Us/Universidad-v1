import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import {
  RiShieldCheckLine, RiCheckLine, RiSparkling2Line as RiSparklingLine,
  RiBookOpenLine, RiRefreshLine, RiLogoutBoxLine,
} from 'react-icons/ri';
import styles from './Checkout.module.css';

const PLAN_ITEMS = [
  'Ramos ilimitados con horario y calendario',
  'IA para estudio (Aprender con claude-sonnet)',
  'Importación automática de syllabus',
  'Seguimiento de asistencia y notas',
  'Acceso desde cualquier dispositivo',
];

function CheckoutSuccess() {
  const navigate           = useNavigate();
  const [params]           = useSearchParams();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); return; }
    fetch(`/api/flow-confirm?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(async data => {
        if (data.status === 'active') { await refreshProfile(); setStatus('ok'); }
        else setStatus('error');
      })
      .catch(() => setStatus('error'));
  }, [params, refreshProfile]);

  if (status === 'loading') return (
    <div className={styles.wrap}>
      <div className={styles.blob1} /><div className={styles.blob2} />
      <div className={styles.card}>
        <RiRefreshLine className={styles.spinning} />
        <p className={styles.loadingText}>Verificando pago…</p>
      </div>
    </div>
  );

  if (status === 'error') return (
    <div className={styles.wrap}>
      <div className={styles.blob1} /><div className={styles.blob2} />
      <div className={styles.card}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2 className={styles.successTitle}>Hubo un problema</h2>
        <p className={styles.successText}>
          No pudimos verificar tu pago. Si ya pagaste, espera un momento y recarga la página.
        </p>
        <button className={styles.continueBtn} onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.blob1} /><div className={styles.blob2} />
      <div className={styles.card}>
        <div className={styles.successBadge}><RiShieldCheckLine /></div>
        <h2 className={styles.successTitle}>¡Pago exitoso!</h2>
        <p className={styles.successText}>Tu suscripción está activa. Ahora configuremos tu plataforma.</p>
        <button className={styles.continueBtn} onClick={() => navigate('/')}>
          Continuar →
        </button>
      </div>
    </div>
  );
}

function CheckoutCancelled() {
  const navigate = useNavigate();
  return (
    <div className={styles.wrap}>
      <div className={styles.blob1} /><div className={styles.blob2} />
      <div className={styles.card}>
        <div className={styles.errorIcon}>✕</div>
        <h2 className={styles.successTitle}>Pago cancelado</h2>
        <p className={styles.successText}>No se realizó ningún cargo. Puedes intentarlo de nuevo cuando quieras.</p>
        <button className={styles.continueBtn} onClick={() => navigate('/checkout')}>
          Volver al pago
        </button>
      </div>
    </div>
  );
}

function CheckoutMain() {
  const { user, profile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/flow-create-subscription', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, email: user?.email, name: profile?.name }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || 'Error al crear la sesión de pago.');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoIcon}><RiBookOpenLine /></div>
          <div className={styles.badge}><RiSparklingLine /> Un paso más</div>
          <h1 className={styles.title}>Activa tu cuenta</h1>
          <p className={styles.subtitle}>
            Hola {profile?.name ?? user?.email?.split('@')[0]}. Para acceder a la plataforma,
            activa tu suscripción mensual.
          </p>
        </div>

        <div className={styles.planCard}>
          <div className={styles.planTop}>
            <div>
              <p className={styles.planName}>Plan Completo</p>
              <div className={styles.planPrice}>
                <span className={styles.planCurrency}>CLP</span>
                <span className={styles.planAmount}>$7.990</span>
                <span className={styles.planPer}>/mes</span>
              </div>
            </div>
            <div className={styles.planBadge}>Mensual</div>
          </div>
          <ul className={styles.planItems}>
            {PLAN_ITEMS.map(item => (
              <li key={item} className={styles.planItem}>
                <span className={styles.planCheck}><RiCheckLine /></span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <button className={styles.payBtn} onClick={handlePay} disabled={loading}>
          <RiShieldCheckLine />
          {loading ? 'Redirigiendo a Flow…' : 'Pagar con Flow'}
        </button>

        <p className={styles.secureNote}>
          <RiShieldCheckLine /> Pago seguro con Flow. Cancela cuando quieras.
        </p>

        <button className={styles.signOutLink} onClick={signOut} type="button">
          <RiLogoutBoxLine /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function Checkout({ variant }) {
  if (variant === 'success')   return <CheckoutSuccess />;
  if (variant === 'cancelled') return <CheckoutCancelled />;
  return <CheckoutMain />;
}
