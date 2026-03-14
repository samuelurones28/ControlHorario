import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { usePlatformAuth } from '../hooks/usePlatformAuth';
import { platformApi } from '../services/api';
import { 
  Building2, 
  LayoutDashboard, 
  LifeBuoy, 
  CalendarOff, 
  Settings, 
  Users, 
  Activity, 
  LogOut,
  Menu,
  X,
  ShieldAlert
} from 'lucide-react';
import { clsx } from 'clsx';

export const PlatformLayout = () => {
  const { admin, reset } = usePlatformAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await platformApi.post('/platform/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      reset();
      navigate('/login');
    }
  };

  const menuItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'SUPPORT', 'VIEWER'] },
    { path: '/companies', label: 'Empresas', icon: Building2, roles: ['SUPER_ADMIN', 'SUPPORT', 'VIEWER'] },
    { path: '/support', label: 'Soporte Usuarios', icon: LifeBuoy, roles: ['SUPER_ADMIN', 'SUPPORT'] },
    { path: '/holidays', label: 'Festivos Nacionales', icon: CalendarOff, roles: ['SUPER_ADMIN', 'SUPPORT', 'VIEWER'] },
    { path: '/admins', label: 'Administradores', icon: Users, roles: ['SUPER_ADMIN'] },
    { path: '/settings', label: 'Configuración', icon: Settings, roles: ['SUPER_ADMIN'] },
    { path: '/monitoring', label: 'Monitorización', icon: Activity, roles: ['SUPER_ADMIN', 'SUPPORT', 'VIEWER'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(admin?.role || 'VIEWER'));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-gray-900/80 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-center p-6 bg-gray-950 border-b border-gray-800">
          <ShieldAlert className="h-8 w-8 text-orange-500 mr-3" />
          <h1 className="text-xl font-bold tracking-wider">PLATFORM<span className="text-orange-500">ADMIN</span></h1>
          <button 
            className="lg:hidden absolute top-6 right-4 text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-3">
            {allowedItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => clsx(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-orange-600 text-white" 
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
                end={item.path === '/'}
              >
                <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 bg-gray-950 border-t border-gray-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-orange-800 flex items-center justify-center text-orange-200 font-bold">
                {admin?.name?.charAt(0) || 'A'}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{admin?.name}</p>
              <p className="text-xs font-medium text-gray-400 capitalize">{admin?.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center px-4 py-2 border border-gray-700 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between bg-gray-900 border-b border-gray-800 px-4 py-3">
          <div className="flex items-center text-white">
            <ShieldAlert className="h-6 w-6 text-orange-500 mr-2" />
            <span className="font-bold tracking-wider">PLATFORM ADMIN</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-gray-400 hover:text-white pointer"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Content Area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-6 sm:px-6 lg:px-8 h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
