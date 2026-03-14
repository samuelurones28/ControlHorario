import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { usePlatformAuth } from './hooks/usePlatformAuth';
import { platformApi } from './services/api';

// Components
import { PlatformLayout } from './components/PlatformLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Setup2FA } from './pages/Setup2FA';
import { Verify2FA } from './pages/Verify2FA';

import { Dashboard } from './pages/Dashboard';
import { Companies } from './pages/Companies';
import { Support } from './pages/Support';

import { Holidays } from './pages/Holidays';
import { Admins } from './pages/Admins';
import { Settings } from './pages/Settings';
import { Monitoring } from './pages/Monitoring';

function App() {
  const { isAuthenticated, reset, setAuth } = usePlatformAuth();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await platformApi.post('/platform/auth/refresh');
        
        setAuth({
          admin: data.admin,
          token: data.accessToken
        });

      } catch {
        // If refresh fails, we are simply not logged in
        reset();
      }
    };

    if (!isAuthenticated) {
      initAuth();
    }
  }, [isAuthenticated, reset, setAuth]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup-2fa" element={<Setup2FA />} />
        <Route path="/verify-2fa" element={<Verify2FA />} />

        {/* Protected Platform Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PlatformLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/companies/*" element={<Companies />} />
            <Route path="/holidays/*" element={<Holidays />} />
            <Route path="/monitoring" element={<Monitoring />} />

            {/* Support and above */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SUPPORT']} />}>
               <Route path="/support/*" element={<Support />} />
            </Route>

            {/* Super Admin only */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route path="/admins/*" element={<Admins />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
