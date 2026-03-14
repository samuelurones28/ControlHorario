import { useState } from 'react';
import { api } from '../../../services/api';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmployeeInviteModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [formData, setFormData] = useState({ name: '', identifier: '', email: '', role: 'EMPLOYEE', contractType: '', weeklyHours: 40 });
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ identifier: string, pin: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/employees', {
        ...formData,
        weeklyHours: Number(formData.weeklyHours)
      });
      if (res.data.plainPin) {
         setSuccessInfo({ identifier: res.data.identifier, pin: res.data.plainPin });
      } else {
         onSuccess();
         onClose();
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error creating employee');
    }
    setLoading(false);
  };

  const resetAndClose = () => {
     setSuccessInfo(null);
     setFormData({ name: '', identifier: '', email: '', role: 'EMPLOYEE', contractType: '', weeklyHours: 40 });
     onSuccess();
     onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-neutral-100">
          <h3 className="text-xl font-bold text-neutral-800">
             {successInfo ? 'Empleado Creado Exitosamente' : 'Añadir Empleado'}
          </h3>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successInfo ? (
          <div className="p-8 text-center">
             <div className="w-16 h-16 bg-success-100 text-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
             </div>
             <p className="text-neutral-600 mb-6 font-medium">El empleado no proporcionó email. Entrégale estas credenciales para que pueda iniciar sesión por primera vez:</p>
             <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200 inline-block text-left mb-8 shadow-sm">
                <p className="mb-2"><span className="text-neutral-500 font-medium">Identificador:</span> <span className="font-bold text-lg text-neutral-900 ml-2">{successInfo.identifier}</span></p>
                <p><span className="text-neutral-500 font-medium">PIN Temporal:</span> <span className="font-bold font-mono tracking-widest text-2xl text-primary-600 ml-2">{successInfo.pin}</span></p>
             </div>
             <div>
                <button onClick={resetAndClose} className="bg-primary-600 text-white font-bold py-3 px-8 rounded-xl w-full hover:bg-primary-700 transition-colors shadow-sm shadow-primary-500/20">
                  Aceptar y Cerrar
                </button>
             </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
            <div>
              <label className="block text-neutral-700 font-medium mb-1.5">Nombre Completo <span className="text-red-500">*</span></label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none" placeholder="Ej: Laura Gómez" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-700 font-medium mb-1.5">Identificador Único <span className="text-red-500">*</span></label>
                <input required value={formData.identifier} onChange={e => setFormData({...formData, identifier: e.target.value})} type="text" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none" placeholder="Ej: lgomez" />
                <p className="text-xs text-neutral-500 mt-1">Usado para el inicio de sesión.</p>
              </div>
              <div>
                <label className="block text-neutral-700 font-medium mb-1.5">Email (Opcional)</label>
                <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none" placeholder="laura@empresa.com" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-700 font-medium mb-1.5">Tipo de Contrato</label>
                <select value={formData.contractType} onChange={e => setFormData({...formData, contractType: e.target.value})} className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none">
                  <option value="">Seleccionar...</option>
                  <option value="INDEFINIDO">Indefinido</option>
                  <option value="TEMPORAL">Temporal</option>
                  <option value="PRACTICAS">Prácticas</option>
                </select>
              </div>
              <div>
                <label className="block text-neutral-700 font-medium mb-1.5">Horas Semanales <span className="text-red-500">*</span></label>
                <input required type="number" min="1" max="40" step="0.5" value={formData.weeklyHours} onChange={e => setFormData({...formData, weeklyHours: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-neutral-700 font-medium mb-1.5">Rol del Sistema</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none">
                <option value="EMPLOYEE">Empleado Regular</option>
                <option value="ADMIN">Administrador (Acceso al Panel)</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end gap-3">
               <button type="button" onClick={onClose} className="px-5 py-2.5 text-neutral-600 font-medium hover:bg-neutral-100 rounded-xl transition-colors">Cancelar</button>
               <button disabled={loading} type="submit" className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm shadow-primary-500/20 disabled:opacity-70 flex items-center gap-2">
                 {loading && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                 Crear Empleado
               </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
