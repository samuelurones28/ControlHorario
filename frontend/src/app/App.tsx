import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { api, getMe } from './services/api';
import { ClockIn } from './pages/ClockIn';
import { History } from './pages/History';
import { Signatures } from './pages/Signatures';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Employees } from './pages/admin/Employees';
import { Schedules } from './pages/admin/Schedules';
import { AdminAbsences } from './pages/admin/AdminAbsences';
import { AdminHolidays } from './pages/admin/AdminHolidays';
import { AdminAudit } from './pages/admin/AdminAudit';
import { Login } from './pages/Login';
import { Privacy } from './pages/Privacy';
import { PrivacyModal } from './components/PrivacyModal';
import Absences from './pages/Absences';

function App() {
  const { isAuthenticated, reset, setUser } = useAuth();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        const token = data.accessToken;

        if (token) {
          // Get full user data from /auth/me
          try {
            const { data: meData } = await getMe();
            setUser(
              {
                id: meData.id,
                role: meData.role,
                company: meData.companyId,
                name: meData.name,
                email: meData.identifier || ''
              },
              token
            );
          } catch (err) {
            // Fallback to JWT decoding if /me fails
            const payloadBase64 = token.split('.')[1];
            const decodedJson = atob(payloadBase64);
            const decoded = JSON.parse(decodedJson);
            setUser(
              {
                id: decoded.id,
                role: decoded.role,
                company: decoded.companyId,
                name: 'Usuario',
                email: ''
              },
              token
            );
          }
        } else {
          reset();
        }
      } catch {
        reset();
      }
    };

    if (!isAuthenticated) {
      initAuth();
    }
  }, [isAuthenticated, reset, setUser]);

  return (
    <BrowserRouter>
      <PrivacyModal />
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/privacidad" element={<Privacy />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<ClockIn />} />
            <Route path="/history" element={<History />} />
            <Route path="/absences" element={<Absences />} />
            <Route path="/signatures" element={<Signatures />} />

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/employees" element={<Employees />} />
              <Route path="/admin/schedules" element={<Schedules />} />
              <Route path="/admin/absences" element={<AdminAbsences />} />
              <Route path="/admin/holidays" element={<AdminHolidays />} />
              <Route path="/admin/audit" element={<AdminAudit />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
