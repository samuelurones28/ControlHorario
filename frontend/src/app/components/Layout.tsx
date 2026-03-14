import type { ReactNode } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Clock, FileText, Users, Play, Activity, AlertTriangle, CalendarRange, CalendarDays } from 'lucide-react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PrivacyModal } from './PrivacyModal';

const NavButton = ({ to, icon, label, adminOnly = false }: { to: string, icon: ReactNode, label: string, adminOnly?: boolean }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (adminOnly && user?.role !== 'ADMIN') return null;
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <button 
      onClick={() => navigate(to)} 
      className={clsx(
        "flex flex-col sm:flex-row items-center justify-center sm:justify-start w-full h-full sm:h-auto sm:px-4 sm:py-3 sm:mb-2 transition-all font-medium rounded-lg",
        isActive 
          ? "text-primary-600 sm:bg-primary-50" 
          : "text-neutral-500 hover:text-neutral-900 sm:hover:bg-neutral-100"
      )}
    >
      <span className={clsx("mb-1 sm:mb-0 sm:mr-3 transition-transform duration-300", isActive && "text-primary-600")}>{icon}</span>
      <span className="text-[10px] sm:text-sm">{label}</span>
    </button>
  );
};

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const [pendingReports, setPendingReports] = useState(0);

  useEffect(() => {
    const checkReports = async () => {
      try {
        const res = await api.get('/weekly-reports/me/pending');
        setPendingReports(res.data.length);
      } catch {
        // ignore
      }
    };
    if (user && user.role !== 'ADMIN') { // Only employees need to sign
       checkReports();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col sm:flex-row pb-16 sm:pb-0 font-sans">
      <PrivacyModal />
      
      {/* Mobile Header */}
      <header className="sm:hidden bg-white text-neutral-900 fixed top-0 w-full z-20 border-b border-neutral-200 h-14 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Clock className="w-5 h-5 text-primary-500" />
          <span>Control Horario</span>
        </div>
        <button onClick={handleLogout} className="p-2 -mr-2 text-neutral-500 hover:text-neutral-900 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex flex-col w-64 bg-white border-r border-neutral-200 h-screen sticky top-0 shadow-sm z-10">
        <div className="p-6 border-b border-neutral-100 flex items-center gap-3">
          <div className="bg-primary-50 p-2 rounded-xl text-primary-600">
            <Clock className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-neutral-900">Control<br/><span className="text-primary-600">Horario</span></span>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <nav className="space-y-1">
            <NavButton to="/" icon={<Play className="w-5 h-5" />} label="Fichar" />
            <NavButton to="/history" icon={<FileText className="w-5 h-5" />} label="Mi Historial" />
            <NavButton to="/absences" icon={<CalendarDays className="w-5 h-5" />} label="Ausencias" />
            
            {user?.role === 'ADMIN' && (
              <div className="mt-8 pt-4 border-t border-neutral-100">
                <p className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Administración</p>
                <NavButton to="/admin/dashboard" icon={<Activity className="w-5 h-5" />} label="Dashboard" adminOnly />
                <NavButton to="/admin/employees" icon={<Users className="w-5 h-5" />} label="Empleados" adminOnly />
                <NavButton to="/admin/schedules" icon={<CalendarRange className="w-5 h-5" />} label="Horarios" adminOnly />
                <NavButton to="/admin/absences" icon={<CalendarDays className="w-5 h-5" />} label="Permisos" adminOnly />
                <NavButton to="/admin/holidays" icon={<CalendarDays className="w-5 h-5" />} label="Festivos" adminOnly />
              </div>
            )}
          </nav>
        </div>
        
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-neutral-900 truncate">{user?.name}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.company}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex flex-row items-center justify-center w-full gap-2 p-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto pt-14 sm:pt-0 pb-20 sm:pb-4 animate-fade-in-up">
        {pendingReports > 0 && user?.role !== 'ADMIN' && (
          <div onClick={() => navigate('/signatures')} className="cursor-pointer bg-warning-50 text-warning-900 p-4 m-4 sm:m-8 mb-0 rounded-xl hover:bg-warning-100 transition-colors flex items-center gap-4 border border-warning-200">
             <div className="bg-warning-100 p-2 rounded-full">
               <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0" />
             </div>
             <div>
               <p className="font-semibold text-warning-800">Firma Legal Requerida</p>
               <p className="text-sm font-medium mt-0.5 opacity-90">Tienes reportes semanales pendientes de validar según el RDL 8/2019.</p>
             </div>
          </div>
        )}
        <div className="p-4 sm:p-8">
           <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden bg-white border-t border-neutral-200 fixed bottom-0 w-full z-20 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <ul className="flex justify-around items-center h-16 px-2">
          <li className="flex-1 h-full"><NavButton to="/" icon={<Play className="w-5 h-5" />} label="Fichar" /></li>
          <li className="flex-1 h-full"><NavButton to="/history" icon={<FileText className="w-5 h-5" />} label="Historial" /></li>
          <li className="flex-1 h-full"><NavButton to="/absences" icon={<CalendarDays className="w-5 h-5" />} label="Ausencias" /></li>
          {user?.role === 'ADMIN' && (
            <li className="flex-1 h-full"><NavButton to="/admin/dashboard" icon={<Activity className="w-5 h-5" />} label="Admin" adminOnly /></li>
          )}
        </ul>
      </nav>

    </div>
  );
};
