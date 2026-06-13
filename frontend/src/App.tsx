import { Routes, Route, Navigate } from 'react-router';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { useLogout } from './hooks/auth/useLogout';

import LoginView from './views/LoginView';
import AdminDashboard from './views/AdminDashboard';
import EmployeeDashboardContainer from './views/EmployeeDashboardContainer';
import 'leaflet/dist/leaflet.css';

// 1. Komponen Penjaga Pintu (Hanya yang punya Token yang boleh masuk)
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const authContext = useContext(AuthContext);
  if (!authContext?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// 2. Komponen Anti-Nyasar (Kalau sudah login, dilarang buka halaman login lagi)
const GuestRoute = ({ children }: { children: JSX.Element }) => {
  const authContext = useContext(AuthContext);
  if (authContext?.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  
  // Menggunakan custom hook logout yang sudah kita buat sebelumnya
  const handleLogout = useLogout(); 

  return (
    <Routes>
      {/* Redirect akar '/' agar langsung diarahkan ke '/login' */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* RUTE LOGIN */}
      <Route 
        path="/login" 
        element={
          <GuestRoute>
            {/* Perhatikan: onLogin sudah kita hapus karena prosesnya sudah di dalam komponennya sendiri */}
            <LoginView /> 
          </GuestRoute>
        } 
      />

      {/* RUTE DASHBOARD (Dinamis berdasarkan Role!) */}
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            {/* Jika role = owner, render UI Admin. Jika tidak, render UI Employee */}
            {user?.role === 'owner' ? (
              // Kita pakai "as any" sementara agar TypeScript tidak protes 
              // karena struktur User dari Backend sedikit berbeda dengan data dummy lamamu
              <AdminDashboard user={user as any} onLogout={handleLogout} />
            ) : (
              <EmployeeDashboardContainer user={user as any} onLogout={handleLogout} />
            )}
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;