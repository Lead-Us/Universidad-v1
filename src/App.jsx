import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { SettingsProvider } from './lib/SettingsContext.jsx';
import Layout     from './components/layout/Layout.jsx';
import Dashboard  from './pages/Dashboard.jsx';
import Ramos      from './pages/Ramos.jsx';
import RamoDetail from './pages/RamoDetail.jsx';
import Calendario from './pages/Calendario.jsx';
import Aprender   from './pages/Aprender.jsx';
import Tareas           from './pages/Tareas.jsx';
import Settings         from './pages/Settings.jsx';
import Login            from './pages/Login.jsx';
import ImportarArchivos from './pages/ImportarArchivos.jsx';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 40%, #fce7f3 70%, #d1fae5 100%)',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(79,142,247,0.20)',
          borderTopColor: '#4f8ef7',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"            element={<Dashboard />}  />
          <Route path="/ramos"       element={<Ramos />}      />
          <Route path="/ramos/:id"   element={<RamoDetail />} />
          <Route path="/calendario"  element={<Calendario />} />
          <Route path="/aprender"    element={<Aprender />}   />
          <Route path="/tareas"      element={<Dashboard />}  />
          <Route path="/settings"    element={<Settings />}   />
          <Route path="/importar"   element={<ImportarArchivos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </SettingsProvider>
  );
}
