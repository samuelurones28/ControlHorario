import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Save, User, Building } from 'lucide-react';
import clsx from 'clsx';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface ScheduleData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkDay: boolean;
  employeeId?: string | null;
}

export interface ScheduleEmployee {
  id: string;
  name: string;
  identifier: string;
}

export const Schedules = () => {
  const [employees, setEmployees] = useState<ScheduleEmployee[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('COMPANY');
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize empty week
  const getEmptyWeek = (empId: string | null = null): ScheduleData[] => {
    return Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      startTime: '09:00',
      endTime: '17:00',
      isWorkDay: i >= 1 && i <= 5, // Mon-Fri
      employeeId: empId
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [empRes, schedRes] = await Promise.all([
          api.get('/employees'),
          api.get('/schedules/company')
        ]);
        setEmployees(empRes.data);
        
        const companySchedules = schedRes.data.filter((s: { employeeId: string | null }) => !s.employeeId);
        setSchedules(companySchedules.length === 7 ? companySchedules : getEmptyWeek(null));
      } catch (e) {
        console.error('Failed to fetch data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUserSelect = async (userId: string) => {
    setSelectedUser(userId);
    setLoading(true);
    try {
      const isCompany = userId === 'COMPANY';
      // In a real app we might want an endpoint to fetch a specific employee's schedule
      // For MVP we just fetch the entire company and filter
      const res = await api.get('/schedules/company');
      const targetSchedules = res.data.filter((s: { employeeId: string | null }) => isCompany ? !s.employeeId : s.employeeId === userId);
      setSchedules(targetSchedules.length === 7 ? targetSchedules : getEmptyWeek(isCompany ? null : userId));
    } catch {
      console.error('Error fetching schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Add employeeId if not company
      const toSave = schedules.map(s => ({
        ...s,
        employeeId: selectedUser === 'COMPANY' ? null : selectedUser
      }));
      await api.put('/schedules', { schedules: toSave });
      alert('Horario guardado correctamente. Los fichajes fuera de este horario generarán una alerta de desconexión digital.');
    } catch {
      alert('Error guardando horario');
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (dayIndex: number, field: keyof ScheduleData, value: unknown) => {
    const newSchedules = [...schedules];
    const itemIndex = newSchedules.findIndex(s => s.dayOfWeek === dayIndex);
    if (itemIndex >= 0) {
      newSchedules[itemIndex] = { ...newSchedules[itemIndex], [field]: value };
    }
    setSchedules(newSchedules);
  };

  return (
    <div className="animate-fade-in-up max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Horarios y Desconexión Digital</h1>
        <p className="text-neutral-500 mt-2 text-lg">Define los turnos de trabajo. Los fichajes fuera de este rango quedarán registrados para cumplir con el RDL 8/2019.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:max-w-xs">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Configurar horario para:</label>
            <div className="relative">
              <select 
                value={selectedUser}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl py-2.5 pl-10 pr-4 text-neutral-900 focus:ring-2 focus:ring-primary-500 appearance-none shadow-sm"
              >
                <option value="COMPANY">🏢 Horario por Defecto (Empresa)</option>
                <optgroup label="Empleados Específicos">
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>👤 {emp.name} ({emp.identifier})</option>
                  ))}
                </optgroup>
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
                {selectedUser === 'COMPANY' ? <Building className="w-5 h-5"/> : <User className="w-5 h-5"/>}
              </div>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 mt-4 sm:mt-6"
          >
            {saving ? 'Guardando...' : (
              <>
                <Save className="w-5 h-5" />
                Guardar Horario
              </>
            )}
          </button>
        </div>

        <div className="p-0">
          {loading ? (
             <div className="p-12 text-center text-neutral-500">Cargando horario...</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {schedules.sort((a,b) => a.dayOfWeek - b.dayOfWeek).map((schedule) => (
                <div key={schedule.dayOfWeek} className={clsx("p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-center transition-colors", schedule.isWorkDay ? "bg-white" : "bg-neutral-50/50")}>
                  <div className="w-full sm:w-1/3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={schedule.isWorkDay}
                        onChange={(e) => updateDay(schedule.dayOfWeek, 'isWorkDay', e.target.checked)}
                        className="w-5 h-5 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                      />
                      <span className={clsx("font-bold text-lg", schedule.isWorkDay ? "text-neutral-900" : "text-neutral-400 line-through")}>
                        {DAYS[schedule.dayOfWeek]}
                      </span>
                    </label>
                  </div>
                  
                  {schedule.isWorkDay ? (
                    <div className="w-full sm:w-2/3 flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Hora Inicio</label>
                        <input 
                          type="time" 
                          value={schedule.startTime}
                          onChange={(e) => updateDay(schedule.dayOfWeek, 'startTime', e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg py-2 px-3 text-neutral-900 font-medium focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Hora Fin</label>
                        <input 
                          type="time" 
                          value={schedule.endTime}
                          onChange={(e) => updateDay(schedule.dayOfWeek, 'endTime', e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg py-2 px-3 text-neutral-900 font-medium focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full sm:w-2/3 flex items-center h-[62px]">
                      <span className="text-sm font-medium text-neutral-400 px-3 py-2 bg-neutral-100 rounded-lg w-full text-center">Día Libre / Descanso Semanal</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
