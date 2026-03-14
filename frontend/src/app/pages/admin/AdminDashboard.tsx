import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Activity, Download, Clock, CheckCircle, FileText, FileBadge } from 'lucide-react';
import { format } from 'date-fns';
import { EmployeeInviteModal } from './components/EmployeeInviteModal';

interface AdminDashboardEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminDashboardIncident {
  id: string;
  date: string;
  description: string;
  timeEntryId: string;
  employeeId: string;
  employee: {
    name: string;
  };
  timeEntry?: {
    entryType: string;
  };
}

interface AdminDashboardWeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: string;
  signature?: string;
  disputeReason?: string;
  employee: {
    name: string;
  };
}

interface DailyReportItem {
  employee: {
    id: string;
    name: string;
  };
  status: string;
  netWorked: number;
}

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const [dailyReport, setDailyReport] = useState<DailyReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [employees, setEmployees] = useState<AdminDashboardEmployee[]>([]);
  const [incidents, setIncidents] = useState<AdminDashboardIncident[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<AdminDashboardWeeklyReport[]>([]);

  // Export date picker state
  const [exportFrom, setExportFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exportTo, setExportTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exportLoading, setExportLoading] = useState(false);

  const fetchDailyReport = async () => {
     setLoading(true);
     try {
       const today = format(new Date(), 'yyyy-MM-dd');
       const res = await api.get(`/reports/daily?date=${today}`);
       setDailyReport(res.data);
     } catch {
        // block errors silently
     }
     setLoading(false);
  };

  const fetchEmployees = async () => {
     try {
       const res = await api.get('/employees');
       setEmployees(res.data);
     } catch {
        // block errors silently
     }
  };

  const fetchIncidents = async () => {
     try {
       const res = await api.get('/incidents/all?status=OPEN');
       setIncidents(res.data);
     } catch {
        // block errors silently
     }
  };

  const fetchWeeklyReports = async () => {
     try {
       const res = await api.get('/weekly-reports/all');
       setWeeklyReports(res.data);
     } catch {
        // block errors silently
     }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeTab === 'DASHBOARD') fetchDailyReport();
    if (activeTab === 'EMPLOYEES') fetchEmployees();
    if (activeTab === 'INCIDENTS') fetchIncidents();
    if (activeTab === 'SIGNATURES') fetchWeeklyReports();
  }, [activeTab]);

  const resolveIncident = async (incident: AdminDashboardIncident) => {
     const newTimeStr = prompt(`Ingresa la nueva hora (HH:mm) para resolver la incidencia del fichaje original:`);
     if (!newTimeStr || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTimeStr)) {
        alert("Formato inválido. Usa HH:mm");
        return;
     }

     const dateObj = new Date(incident.date);
     const [hours, minutes] = newTimeStr.split(':');
     dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

     try {
        await api.post(`/time-entries/amendments`, { 
          incidentId: incident.id,
          originalEntryId: incident.timeEntryId,
          employeeId: incident.employeeId,
          action: 'MODIFY',
          newTimestamp: dateObj.toISOString(),
          entryType: incident.timeEntry ? incident.timeEntry.entryType : 'CLOCK_IN',
          reason: 'Resolución de incidencia por administrador'
        });
        alert('Incidencia resuelta. El fichaje ha sido modificado.');
        fetchIncidents();
     } catch (err) {
        const e = err as { response?: { data?: { message?: string } } };
        alert("Error resolviendo incidencia: " + (e.response?.data?.message || ''));
     }
  };

  const downloadReport = async (format: 'csv' | 'pdf') => {
    if (!exportFrom || !exportTo) {
      alert('Selecciona rango de fechas válido');
      return;
    }

    setExportLoading(true);
    try {
      const { data } = await api.get(
        `/reports/export?from=${exportFrom}&to=${exportTo}&format=${format}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      const ext = format === 'pdf' ? 'pdf' : 'csv';
      link.setAttribute('download', `reporte_${exportFrom}_${exportTo}.${ext}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert(`Error descargando ${format.toUpperCase()}`);
    } finally {
      setExportLoading(false);
    }
  };

  const downloadProtocol = async () => {
    try {
      const res = await api.get('/protocol/download', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Protocolo_Interno_Control_Horario.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch {
      alert("Error descargando PDF del Protocolo");
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 animate-fade-in-up">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary-50 p-3.5 rounded-2xl text-primary-600">
          <Activity className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
          Panel de Administración
        </h1>
      </div>

      <div className="flex space-x-2 mb-8 overflow-x-auto pb-4 scrollbar-hide">
        {['DASHBOARD', 'EMPLOYEES', 'INCIDENTS', 'SIGNATURES', 'EXPORT'].map(tab => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap outline-none flex items-center gap-2 ${activeTab === tab ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100 ring-1 ring-primary-500/20' : 'bg-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'}`}
           >
             {tab === 'DASHBOARD' ? 'Resumen Hoy' : tab === 'EMPLOYEES' ? 'Empleados' : tab === 'INCIDENTS' ? 'Incidencias' : tab === 'SIGNATURES' ? 'Reportes Legales' : 'Exportar CSV'}
           </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-10 min-h-[50vh]">
        {activeTab === 'DASHBOARD' && (
           <div className="animate-in fade-in duration-300">
             <h2 className="text-xl font-bold mb-6 text-neutral-800">Estado de Empleados (Hoy)</h2>
             {loading ? <p className="text-neutral-400 font-medium">Cargando datos...</p> : (
               <div className="overflow-x-auto rounded-xl border border-neutral-200">
                 <table className="min-w-full divide-y divide-neutral-200">
                   <thead className="bg-neutral-50">
                     <tr>
                       <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Empleado</th>
                       <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Estado</th>
                       <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Horas (Formato Decimal)</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-neutral-100 bg-white">
                     {dailyReport.length === 0 ? (
                       <tr><td colSpan={3} className="px-6 py-10 text-center text-neutral-400 font-medium">No hay trabajadores activos.</td></tr>
                     ) : dailyReport.map(report => (
                       <tr key={report.employee.id} className="hover:bg-neutral-50/50 transition-colors">
                         <td className="px-6 py-4 text-sm font-semibold text-neutral-900">{report.employee.name}</td>
                         <td className="px-6 py-4 text-sm">
                           <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${report.status === 'FICHADO' ? 'bg-success-50 text-success-700 border border-success-200' : report.status === 'EN_PAUSA' ? 'bg-warning-50 text-warning-700 border border-warning-200' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'}`}>
                             {report.status.replace('_', ' ')}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-sm font-mono text-neutral-600 font-medium">{report.netWorked} h</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
           </div>
        )}

        {activeTab === 'EMPLOYEES' && (
           <div className="animate-in fade-in duration-300">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-neutral-800">Directorio de Empleados</h2>
                <button 
                  onClick={() => setIsInviteModalOpen(true)}
                  className="px-4 py-2.5 bg-primary-600 text-white hover:bg-primary-700 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  + Invitar Empleado
                </button>
             </div>
             
             <div className="overflow-x-auto rounded-xl border border-neutral-200">
                 <table className="min-w-full divide-y divide-neutral-200">
                   <thead className="bg-neutral-50">
                     <tr>
                       <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nombre</th>
                       <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Email</th>
                       <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Rol</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-neutral-100 bg-white">
                     {employees.map(emp => (
                       <tr key={emp.id} className="hover:bg-neutral-50/50 transition-colors">
                         <td className="px-6 py-4 text-sm font-semibold text-neutral-900">{emp.name}</td>
                         <td className="px-6 py-4 text-sm text-neutral-500">{emp.email}</td>
                         <td className="px-6 py-4 text-sm"><span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs font-semibold rounded-md border border-neutral-200">{emp.role}</span></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
           </div>
        )}

        {activeTab === 'INCIDENTS' && (
           <div className="animate-in fade-in duration-300">
             <h2 className="text-xl font-bold mb-6 text-neutral-800">Gestión de Incidencias</h2>
             {incidents.length === 0 ? (
               <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-neutral-100">
                 <CheckCircle className="w-10 h-10 text-success-400 mx-auto mb-3" />
                 <p className="text-neutral-500 font-medium">No hay incidencias abiertas en este momento.</p>
               </div>
             ) : (
               <ul className="space-y-4 shadow-sm mt-4">
                 {incidents.map(inc => (
                   <li key={inc.id} className="p-5 md:p-6 rounded-2xl border border-neutral-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-neutral-50/50 transition-colors">
                     <div>
                       <p className="font-bold text-lg text-neutral-900 mb-1">{inc.employee.name}</p>
                       <p className="text-sm text-neutral-700 bg-warning-50 px-3 py-2 rounded-lg border border-warning-200 inline-block mb-3">
                         <strong className="font-semibold text-warning-800 mr-1.5">Motivo de corrección:</strong> {inc.description}
                       </p>
                       <p className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                         <Clock className="w-4 h-4 text-neutral-400" />
                         Fichaje cuestionado: <span className="font-semibold text-neutral-800">{format(new Date(inc.date), 'dd/MM/yyyy HH:mm')}</span>
                       </p>
                     </div>
                     <div className="flex w-full md:w-auto mt-2 md:mt-0">
                       <button onClick={() => resolveIncident(inc)} className="w-full md:w-auto px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">Resolver Incidencia</button>
                     </div>
                   </li>
                 ))}
               </ul>
             )}
           </div>
        )}

        {activeTab === 'SIGNATURES' && (
           <div className="animate-in fade-in duration-300">
             <h2 className="text-xl font-bold mb-6 text-neutral-800">Firmas y Reportes Legales</h2>
             {weeklyReports.length === 0 ? (
               <div className="text-center py-16 bg-neutral-50 border border-neutral-100 rounded-2xl">
                 <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                 <p className="text-neutral-500 font-medium">Aún no se han generado reportes semanales.</p>
               </div>
             ) : (
               <div className="overflow-x-auto rounded-xl border border-neutral-200 mt-4 shadow-sm">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Semana</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Empleado</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Estado de Firma</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Hash / Razón</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 bg-white">
                      {weeklyReports.map(report => (
                        <tr key={report.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-neutral-700 whitespace-nowrap">{format(new Date(report.weekStart), 'dd/MM')} - {format(new Date(report.weekEnd), 'dd/MM')}</td>
                          <td className="px-6 py-4 text-sm text-neutral-900 font-semibold">{report.employee.name}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${report.status === 'ACCEPTED' ? 'bg-success-50 text-success-700 border border-success-200' : report.status === 'DISPUTED' ? 'bg-danger-50 text-danger-700 border border-danger-200' : 'bg-warning-50 text-warning-700 border border-warning-200'}`}>{report.status === 'PENDING' ? 'Pendiente' : report.status === 'ACCEPTED' ? 'Firmado' : 'Disputado'}</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-neutral-500 font-mono break-all max-w-[200px]">{report.signature || report.disputeReason || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             )}
           </div>
        )}

        {activeTab === 'EXPORT' && (
           <div className="animate-in fade-in duration-300">
             <h2 className="text-xl font-bold mb-6 text-neutral-800">Exportar Datos</h2>

             {/* Date Range Picker */}
             <div className="mb-8 p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
               <p className="text-sm font-semibold text-neutral-700 mb-4">Selecciona el rango de fechas para los reportes:</p>
               <div className="flex flex-col sm:flex-row gap-4 items-end">
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-neutral-700 mb-2">Desde</label>
                   <input
                     type="date"
                     value={exportFrom}
                     onChange={(e) => setExportFrom(e.target.value)}
                     className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                   />
                 </div>
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-neutral-700 mb-2">Hasta</label>
                   <input
                     type="date"
                     value={exportTo}
                     onChange={(e) => setExportTo(e.target.value)}
                     className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                   />
                 </div>
               </div>
             </div>

             {/* Export Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* CSV Export Card */}
               <div className="flex flex-col items-center p-8 bg-white border border-neutral-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                 <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-primary-100">
                    <Download className="w-8 h-8 text-primary-600" />
                 </div>
                 <h3 className="text-lg font-bold mb-2 text-neutral-900 text-center">Fichajes (CSV)</h3>
                 <p className="text-neutral-500 mb-8 text-center text-sm">Reporte en formato CSV con todos los registros del período seleccionado.</p>
                 <button
                   onClick={() => downloadReport('csv')}
                   disabled={exportLoading}
                   className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm"
                 >
                   {exportLoading ? 'Descargando...' : 'Descargar CSV'}
                 </button>
               </div>

               {/* PDF Reports Card */}
               <div className="flex flex-col items-center p-8 bg-white border border-neutral-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                 <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-purple-100">
                    <FileBadge className="w-8 h-8 text-purple-600" />
                 </div>
                 <h3 className="text-lg font-bold mb-2 text-neutral-900 text-center">Fichajes (PDF)</h3>
                 <p className="text-neutral-500 mb-8 text-center text-sm">Reporte oficial en PDF con tabla formateada para inspecciones laborales.</p>
                 <button
                   onClick={() => downloadReport('pdf')}
                   disabled={exportLoading}
                   className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all shadow-sm"
                 >
                   {exportLoading ? 'Descargando...' : 'Descargar PDF'}
                 </button>
               </div>

               {/* Protocol PDF Card */}
               <div className="flex flex-col items-center p-8 bg-white border border-neutral-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                 <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                    <FileText className="w-8 h-8 text-blue-600" />
                 </div>
                 <h3 className="text-lg font-bold mb-2 text-neutral-900 text-center">Protocolo Interno</h3>
                 <p className="text-neutral-500 mb-8 text-center text-sm">Protocolo de sistema de fichajes y desconexión digital configurado.</p>
                 <button
                   onClick={downloadProtocol}
                   className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                 >
                   Descargar PDF
                 </button>
               </div>
             </div>
           </div>
        )}
      </div>
      <EmployeeInviteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        onSuccess={fetchEmployees}
      />
    </div>
  );
};
