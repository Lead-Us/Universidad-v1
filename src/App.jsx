import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { SettingsProvider } from './lib/SettingsContext.jsx';
import { useEffect } from 'react';
import { createDemoContent } from './services/aprendizajeService.js';
import Layout           from './components/layout/Layout.jsx';
import Landing          from './pages/Landing.jsx';
import Register         from './pages/Register.jsx';
import Login            from './pages/Login.jsx';
import Checkout         from './pages/Checkout.jsx';
import UpdatePassword   from './pages/UpdatePassword.jsx';
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
import Admin            from './pages/Admin.jsx';
import Tutorial         from './pages/Tutorial.jsx';

function AppRoutes() {
  const { isAuthenticated, isSubscribed, isRecoveryMode, loading, user } = useAuth();

  // Create demo content once for new users (skips silently if they already have notebooks)
  const userId = user?.id;
  useEffect(() => {
    if (userId && isSubscribed) {
      createDemoContent().catch(() => {});
    }
  }, [userId, isSubscribed]);

  // ── Password recovery link clicked ──────────────────────────
  if (isRecoveryMode) {
    return (
      <Routes>
        <Route path="*" element={<UpdatePassword />} />
      </Routes>
    );
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: '#0a0a0a',
      }} />
    );
  }

  // ── Not authenticated ────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/"          element={<Landing />} />
        <Route path="/tutorial"  element={<Tutorial />} />
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
        <Route path="/admin"      element={<Admin />}      />
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
