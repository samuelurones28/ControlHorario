import { Navigate, Outlet } from 'react-router-dom';
import { usePlatformAuth } from '../hooks/usePlatformAuth';

interface ProtectedRouteProps {
  allowedRoles?: Array<'SUPER_ADMIN' | 'SUPPORT' | 'VIEWER'>;
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, requiresTOTP, needsSetup, admin } = usePlatformAuth();

  if (needsSetup) {
    return <Navigate to="/setup-2fa" replace />;
  }

  if (requiresTOTP) {
    return <Navigate to="/verify-2fa" replace />;
  }

  if (!isAuthenticated || !admin) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(admin.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
