import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { absencesApi, type AbsenceRequestData } from '../../../services/absences.api';
import { X, AlertTriangle, Umbrella } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  identifier: string;
  role: string;
  contractType: string | null;
  weeklyHours: number;
  active: boolean;
}

interface ExtendedAbsence extends AbsenceRequestData {
  employee: {
    id: string;
    name: string;
    identifier: string;
  };
}

interface Props {
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmployeeEditModal = ({ employee, onClose, onSuccess }: Props) => {
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    role: 'EMPLOYEE',
    contractType: '',
    weeklyHours: 40,
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vacationDays, setVacationDays] = useState<number | null>(null);

  useEffect(() => {
    if (employee) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: employee.name,
        identifier: employee.identifier,
        role: employee.role,
        contractType: employee.contractType ?? '',
        weeklyHours: employee.weeklyHours,
        active: employee.active,
      });
      setError('');

      // Fetch absences
      const fetchAbsences = async () => { // Changed to async function
        const currentYear = new Date().getFullYear();
        try {
          const data = await absencesApi.getCompanyRequests();
          const typedData = data as ExtendedAbsence[];
          
          const used = typedData
            .filter(r => r.employee?.id === employee.id && r.status === 'APPROVED' && r.type === 'VACATION' && new Date(r.startDate).getFullYear() === currentYear)
            .reduce((acc, curr) => acc + curr.businessDays, 0);
          setVacationDays(used);
        } catch (err) {
          console.error(err); // Corrected catch block
        }
      };
      fetchAbsences(); // Call the async function
    }
  }, [employee]);

  if (!employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.patch(`/employees/${employee.id}`, {
        ...formData,
        contractType: formData.contractType || null,
        weeklyHours: Number(formData.weeklyHours),
      });
      onSuccess();
      onClose();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al actualizar el empleado');
    }
    setLoading(false);
  };

  const willDeactivate = employee.active && !formData.active;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-neutral-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-neutral-100">
          <h3 className="text-xl font-bold text-neutral-900">
            Editar Empleado
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm">
          <div>
            <label className="block text-neutral-700 font-semibold mb-1.5">
              Nombre Completo <span className="text-danger-500">*</span>
            </label>
            <input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              type="text"
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-700 font-semibold mb-1.5">
                Identificador <span className="text-danger-500">*</span>
              </label>
              <input
                required
                value={formData.identifier}
                onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                type="text"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-semibold mb-1.5">
                Horas Semanales <span className="text-danger-500">*</span>
              </label>
              <input
                required
                type="number"
                min="1"
                max="40"
                step="0.5"
                value={formData.weeklyHours}
                onChange={e => setFormData({ ...formData, weeklyHours: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-700 font-semibold mb-1.5">
                Tipo de Contrato
              </label>
              <select
                value={formData.contractType}
                onChange={e => setFormData({ ...formData, contractType: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none appearance-none"
              >
                <option value="">Sin especificar</option>
                <option value="INDEFINIDO">Indefinido</option>
                <option value="TEMPORAL">Temporal</option>
                <option value="PRACTICAS">Prácticas</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-700 font-semibold mb-1.5">
                Rol del Sistema
              </label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none appearance-none"
              >
                <option value="EMPLOYEE">Empleado Regular</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 bg-neutral-50">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, active: !formData.active })}
              className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${formData.active ? 'bg-success-500' : 'bg-neutral-300'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${formData.active ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
            <span className="font-semibold text-neutral-700">
              Empleado {formData.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {willDeactivate && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-50 border border-warning-200">
              <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-warning-800">
                Al desactivar este empleado ya no podrá iniciar sesión ni fichar. Sus registros históricos se conservan.
              </p>
            </div>
          )}

          {vacationDays !== null && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200" title="Estatuto Trabajadores: 30 naturales / 22 laborables mínimo">
              <Umbrella className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Vacaciones disfrutadas en {new Date().getFullYear()}
                </p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{vacationDays} días laborables</p>
                <p className="text-xs font-medium text-blue-600 mt-1 opacity-80 cursor-help">El mínimo legal (Estatuto) es 22 días laborables.</p>
              </div>
            </div>
          )}

          {error && (
            <p className="px-4 py-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl font-medium text-sm">
              {error}
            </p>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={loading}
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-semibold shadow-sm shadow-primary-500/20 hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
