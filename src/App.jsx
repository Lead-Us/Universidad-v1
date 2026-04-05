import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { SettingsProvider } from './lib/SettingsContext.jsx';
import { useState, useEffect } from 'react';
import Layout           from './components/layout/Layout.jsx';
import Landing          from './pages/Landing.jsx';
import Register         from './pages/Register.jsx';
import Login            from './pages/Login.jsx';
import Checkout         from './pages/Checkout.jsx';
import Onboarding       from './pages/Onboarding.jsx';
import Dashboard        from './pages/Dashboard.jsx';
import Ramos            from './pages/Ramos.jsx';
import RamoDetail       from './pages/RamoDetail.jsx';
import Calendario       from './pages/Calendario.jsx';
import Aprender          from './pages/Aprender.jsx';
import AprenderCuaderno  from './pages/AprenderCuaderno.jsx';
import AprenderBloque    from './pages/AprenderBloque.jsx';
import Notebook         from './pages/Notebook.jsx';
import Settings         from './pages/Settings.jsx';
import ImportarArchivos from './pages/ImportarArchivos.jsx';

function AppRoutes() {
  const { isAuthenticated, isSubscribed, loading, user } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(true);

  useEffect(() => {
    if (user) {
      const done = !!localStorage.getItem(`uni_onboarding_done_${user.id}`);
      setOnboardingDone(done);
    }
  }, [user]);

  const completeOnboarding = () => {
    if (user) localStorage.setItem(`uni_onboarding_done_${user.id}`, '1');
    setOnboardingDone(true);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 40%, #fce7f3 70%, #d1fae5 100%)',
      }} />
    );
  }

  // ── Not authenticated ────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/"          element={<Landing />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        {/* Stripe redirects land here even before auth is restored — harmless */}
        <Route path="/checkout/success"   element={<Checkout variant="success" />} />
        <Route path="/checkout/cancelled" element={<Checkout variant="cancelled" />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // ── Authenticated but not subscribed yet ─────────────────────
  if (!isSubscribed) {
    return (
      <Routes>
        <Route path="/checkout"           element={<Checkout />} />
        <Route path="/checkout/success"   element={<Checkout variant="success" />} />
        <Route path="/checkout/cancelled" element={<Checkout variant="cancelled" />} />
        <Route path="*"                   element={<Navigate to="/checkout" replace />} />
      </Routes>
    );
  }

  // ── Subscribed but onboarding not done ───────────────────────
  if (!onboardingDone) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  // ── Full app ─────────────────────────────────────────────────
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"           element={<Dashboard />}  />
        <Route path="/ramos"      element={<Ramos />}      />
        <Route path="/ramos/:id"  element={<RamoDetail />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/aprender"                             element={<Aprender />}         />
        <Route path="/aprender/:notebookId"             element={<AprenderCuaderno />} />
        <Route path="/aprender/:notebookId/:blockId"    element={<AprenderBloque />}   />
        <Route path="/notebook"   element={<Notebook />}   />
        <Route path="/tareas"     element={<Calendario />} />
        <Route path="/settings"   element={<Settings />}   />
        <Route path="/importar"   element={<ImportarArchivos />} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </SettingsProvider>
  );
}
