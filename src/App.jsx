import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { SettingsProvider } from './lib/SettingsContext.jsx';
import { useState, useEffect } from 'react';
import Layout     from './components/layout/Layout.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard  from './pages/Dashboard.jsx';
import Ramos      from './pages/Ramos.jsx';
import RamoDetail from './pages/RamoDetail.jsx';
import Calendario from './pages/Calendario.jsx';
import Aprender   from './pages/Aprender.jsx';
import Notebook   from './pages/Notebook.jsx';
import Tareas           from './pages/Tareas.jsx';
import Settings         from './pages/Settings.jsx';
import Login            from './pages/Login.jsx';
import ImportarArchivos from './pages/ImportarArchivos.jsx';

function AppRoutes() {
  const { isAuthenticated, loading, user } = useAuth();
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

  if (!isAuthenticated) {
    return <Login />;
  }

  if (!onboardingDone) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"            element={<Dashboard />}  />
        <Route path="/ramos"       element={<Ramos />}      />
        <Route path="/ramos/:id"   element={<RamoDetail />} />
        <Route path="/calendario"  element={<Calendario />} />
        <Route path="/aprender"    element={<Aprender />}   />
        <Route path="/notebook"    element={<Notebook />}   />
        <Route path="/tareas"      element={<Dashboard />}  />
        <Route path="/settings"    element={<Settings />}   />
        <Route path="/importar"    element={<ImportarArchivos />} />
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
