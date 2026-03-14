import { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { Users2, Search, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmployeeInviteModal } from './components/EmployeeInviteModal';
import { EmployeeEditModal } from './components/EmployeeEditModal';

interface Employee {
  id: string;
  name: string;
  identifier: string;
  role: string;
  contractType: string | null;
  weeklyHours: number;
  active: boolean;
  createdAt: string;
}

type FilterStatus = 'ALL' | 'ACTIVE' | 'INACTIVE';

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

export const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch {
      // no-op
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmployees();
  }, []);

  const filtered = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch =
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.identifier.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && emp.active) ||
        (filterStatus === 'INACTIVE' && !emp.active);
      return matchSearch && matchStatus;
    });
  }, [employees, search, filterStatus]);

  const totalActive = employees.filter(e => e.active).length;
  const totalInactive = employees.filter(e => !e.active).length;
  const totalAdmins = employees.filter(e => e.role === 'ADMIN').length;

  const toggleActive = async (emp: Employee) => {
    setTogglingId(emp.id);
    try {
      await api.patch(`/employees/${emp.id}`, { active: !emp.active });
      await fetchEmployees();
    } catch {
      // no-op
    }
    setTogglingId(null);
  };

  const contractLabel: Record<string, string> = {
    INDEFINIDO: 'Indefinido',
    TEMPORAL: 'Temporal',
    PRACTICAS: 'Prácticas',
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-primary-50 p-3.5 rounded-2xl text-primary-600">
            <Users2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
             Empleados
          </h1>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-sm shadow-primary-500/20 active:scale-95 transition-all whitespace-nowrap"
        >
          + Nuevo Empleado
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col justify-center">
          <p className="text-sm font-medium text-neutral-500 mb-1">Total Plantilla</p>
          <p className="text-4xl font-bold text-neutral-900">{employees.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-5 h-5 text-success-500" />
            <p className="text-sm font-medium text-neutral-500">Activos</p>
          </div>
          <p className="text-4xl font-bold text-neutral-900">{totalActive}</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-primary-500" />
            <p className="text-sm font-medium text-neutral-500">Administradores</p>
          </div>
          <p className="text-4xl font-bold text-neutral-900">{totalAdmins}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o identificador..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-white font-medium text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-colors placeholder:text-neutral-400 shadow-sm"
          />
        </div>
        <div className="flex bg-neutral-100 p-1 rounded-xl shadow-sm border border-neutral-200/50">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as FilterStatus[]).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                filterStatus === status
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'bg-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {status === 'ALL' ? 'Todos' : status === 'ACTIVE' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden min-h-[40vh]">
        {loading ? (
          <div className="flex items-center justify-center py-20 h-full">
            <p className="text-neutral-400 font-medium animate-pulse text-sm">Cargando empleados...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center h-full">
            <div className="bg-neutral-50 p-4 rounded-full mb-4">
               <UserX className="w-10 h-10 text-neutral-300" />
            </div>
            <p className="text-neutral-500 font-medium mb-1">
              {employees.length === 0 ? 'No hay empleados registrados.' : 'No se encontraron resultados.'}
            </p>
            {employees.length === 0 && (
              <button
                onClick={() => setIsInviteOpen(true)}
                className="mt-4 px-5 py-2.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-sm font-semibold transition-colors"
              >
                Añadir primer empleado
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Empleado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Contrato</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Horas</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Alta</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {filtered.map(emp => (
                  <tr
                    key={emp.id}
                    className={`transition-colors hover:bg-neutral-50/50 ${emp.active ? '' : 'opacity-70 bg-neutral-50'}`}
                  >
                    {/* Empleado */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0 border border-primary-200">
                          <span className="text-sm">{getInitials(emp.name)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-neutral-900">{emp.name}</p>
                          <p className="text-xs text-neutral-500">{emp.identifier}</p>
                        </div>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-md border ${
                          emp.role === 'ADMIN'
                            ? 'bg-primary-50 text-primary-700 border-primary-200'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {emp.role === 'ADMIN' ? 'Admin' : 'Empleado'}
                      </span>
                    </td>

                    {/* Contrato */}
                    <td className="px-6 py-4 text-sm text-neutral-600 font-medium">
                      {emp.contractType ? contractLabel[emp.contractType] ?? emp.contractType : '—'}
                    </td>

                    {/* Horas */}
                    <td className="px-6 py-4 text-sm text-neutral-600 font-medium">
                      {emp.weeklyHours}h/sem
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-md border ${
                          emp.active
                            ? 'bg-success-50 text-success-700 border-success-200'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {emp.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Alta */}
                    <td className="px-6 py-4 text-sm text-neutral-500 font-medium">
                      {format(new Date(emp.createdAt), 'dd MMM yyyy', { locale: es })}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingEmployee(emp)}
                          className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleActive(emp)}
                          disabled={togglingId === emp.id}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-50 ${
                            emp.active
                              ? 'border-neutral-200 text-danger-600 hover:bg-danger-50 hover:border-danger-200'
                              : 'bg-neutral-900 text-white border-transparent hover:bg-neutral-800'
                          }`}
                        >
                          {togglingId === emp.id ? '...' : emp.active ? 'Suspender' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
            <p className="text-sm font-medium text-neutral-500">
              Mostrando {filtered.length} de {employees.length} empleados
              {totalInactive > 0 && ` · ${totalInactive} inactivo${totalInactive > 1 ? 's' : ''}`}
            </p>
          </div>
        )}
      </div>

      <EmployeeInviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={fetchEmployees}
      />

      <EmployeeEditModal
        employee={editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onSuccess={fetchEmployees}
      />
    </div>
  );
};
