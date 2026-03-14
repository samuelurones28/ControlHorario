import { useState, useEffect } from 'react';
import { absencesApi } from '../services/absences.api';
import type { AbsenceRequestData } from '../services/absences.api';
import { CreateAbsenceModal } from '../components/CreateAbsenceModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, XCircle, Calendar, RefreshCw } from 'lucide-react';

export default function Absences() {
  const [requests, setRequests] = useState<AbsenceRequestData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await absencesApi.getMyRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancel = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas cancelar esta solicitud?')) return;
    try {
      await absencesApi.cancelRequest(id);
      fetchRequests();
    } catch {
      alert('Error al cancelar la solicitud');
    }
  };

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
      UNPAID_LEAVE: 'Permiso no retribuido',
      OTHER: 'Otro'
    };
    return map[type] || type;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-regular text-gray-900 tracking-tight">Mis Ausencias</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Historial de permisos y solicitudes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchRequests}
            className="flex items-center justify-center p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            title="Actualizar"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-[#E85D04] text-white px-5 py-2.5 rounded-lg hover:bg-[#D05303] transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="font-medium text-sm">Solicitar Permiso</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 font-medium">Cargando historial...</div>
        ) : requests.length === 0 ? (
          <div className="p-16 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Sin historial de ausencias</h3>
            <p className="text-gray-500 text-sm">No has solicitado ningún permiso todavía.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fechas</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Días Lab.</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-gray-900">{getTypeTranslate(req.type)}</div>
                      {req.notes && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs" title={req.notes}>{req.notes}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(req.startDate), 'dd MMM yyyy', { locale: es })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        al {format(new Date(req.endDate), 'dd MMM yyyy', { locale: es })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 bg-gray-50 w-fit px-2.5 py-1 rounded-md border border-gray-200">
                        {req.businessDays} {req.businessDays === 1 ? 'día' : 'días'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getStatusColor(req.status)}`}>
                        {getStatusText(req.status)}
                      </span>
                      {req.reviewNote && req.status === 'REJECTED' && (
                        <div className="text-xs text-rose-600 mt-2 font-medium" title={req.reviewNote}>
                          Motivo: {req.reviewNote}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(req.id)}
                          className="text-gray-400 hover:text-rose-600 transition-colors inline-flex items-center space-x-1"
                          title="Cancelar solicitud"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateAbsenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchRequests();
        }}
      />
    </div>
  );
}
