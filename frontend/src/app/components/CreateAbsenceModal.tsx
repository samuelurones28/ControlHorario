import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { absencesApi } from '../services/absences.api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateAbsenceModal({ isOpen, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    type: 'VACATION',
    startDate: '',
    endDate: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      setError('Las fechas son obligatorias');
      return;
    }
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      setError('La fecha de fin no puede ser anterior a la de inicio');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await absencesApi.createRequest({
        ...formData,
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });
      onSuccess();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al crear la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const getEstBusinessDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) return 0;
    
    // Estimación rápida en frontend (sin contar festivos, solo findes)
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const estDays = getEstBusinessDays();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2 text-[#E85D04]">
            <Calendar className="h-5 w-5" />
            <h2 className="text-xl font-medium tracking-tight text-gray-900">Solicitar Permiso</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ausencia</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E85D04] focus:border-transparent transition-all outline-none"
            >
              <option value="VACATION">Vacaciones</option>
              <option value="SICK_LEAVE">Baja Médica</option>
              <option value="PERSONAL">Asuntos Propios</option>
              <option value="MATERNITY_PATERNITY">Maternidad/Paternidad</option>
              <option value="UNPAID_LEAVE">Permiso No Retribuido</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E85D04] focus:border-transparent transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
              <input
                type="date"
                required
                min={formData.startDate}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E85D04] focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {estDays > 0 && (
            <div className="text-xs text-gray-500 font-medium mt-1">
              Días laborables estimados: <span className="text-[#E85D04] font-semibold">{estDays}</span> (descontando fines de semana).
            </div>
          )}

          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E85D04] focus:border-transparent transition-all outline-none resize-none h-24"
              placeholder="Detalles adicionales sobre el permiso..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E85D04] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#D05303] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E85D04] disabled:opacity-50 transition-all mt-6 shadow-sm"
          >
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
}
