import { useState, useEffect } from 'react';
import { absencesApi } from '../../services/absences.api';
import type { AbsenceRequestData } from '../../services/absences.api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface ExtendedAbsence extends AbsenceRequestData {
  employee: {
    name: string;
    identifier: string;
  };
}

export function AdminAbsences() {
  const [requests, setRequests] = useState<ExtendedAbsence[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'ALL' | 'PENDING'>('PENDING');

  const fetchRequests = async () => {
    try {
      const data = await absencesApi.getCompanyRequests();
      setRequests(data as ExtendedAbsence[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    let reviewNote = '';
    if (newStatus === 'REJECTED') {
      const note = window.prompt('Indica el motivo del rechazo (obligatorio):');
      if (!note) return;
      reviewNote = note;
    } else {
      if (!window.confirm('¿Aprobar esta solicitud?')) return;
    }

    try {
      await absencesApi.updateStatus(id, newStatus, reviewNote);
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar estado');
    }
  };

  const filteredRequests = requests.filter(r => filterMode === 'ALL' || r.status === filterMode);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800';
      case 'REJECTED': return 'bg-rose-100 text-rose-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-amber-100 text-amber-800'; // PENDING
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'Aprobada';
      case 'REJECTED': return 'Rechazada';
      case 'CANCELLED': return 'Cancelada';
      default: return 'Pendiente';
    }
  };

  const getTypeTranslate = (type: string) => {
    const map: Record<string, string> = {
      VACATION: 'Vacaciones',
      SICK_LEAVE: 'Baja Médica',
      PERSONAL: 'Asuntos Propios',
      MATERNITY_PATERNITY: 'Maternidad/Paternidad',
      UNPAID_LEAVE: 'Permiso',
      OTHER: 'Otro'
    };
    return map[type] || type;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-regular tracking-tight text-gray-900">Gestión de Ausencias</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Revisa y aprueba solicitudes del equipo</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterMode('PENDING')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterMode === 'PENDING' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterMode === 'ALL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Historial Completo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 font-medium">Cargando solicitudes...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-16 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nada por aquí</h3>
            <p className="text-gray-500 text-sm">No hay solicitudes que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empleado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo & Fechas</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duración</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{req.employee?.name}</div>
                      <div className="text-xs text-gray-500">{req.employee?.identifier}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-gray-900">{getTypeTranslate(req.type)}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(req.startDate), 'dd MMM yyyy', { locale: es })} - {format(new Date(req.endDate), 'dd MMM yyyy', { locale: es })}
                      </div>
                      {req.notes && <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">{req.notes}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                        {req.businessDays} {req.businessDays === 1 ? 'día' : 'días'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getStatusColor(req.status)}`}>
                        {getStatusText(req.status)}
                      </span>
                      {req.reviewNote && req.status === 'REJECTED' && (
                        <div className="text-xs text-rose-600 mt-1 font-medium title" title={req.reviewNote}>
                          Rechazado: {req.reviewNote}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Aprobar"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                            title="Rechazar"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
