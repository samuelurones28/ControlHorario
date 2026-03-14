import { useEffect, useState } from 'react';
import { getPrivacyPolicy } from '../services/api';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Privacy() {
  const [policy, setPolicy] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const { data } = await getPrivacyPolicy();
        setPolicy(data.policy || '');
      } catch (err) {
        setError('Error al cargar la política de privacidad');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al login</span>
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>

          <div className="prose prose-sm max-w-none">
            <div className="bg-gray-50 p-6 rounded-lg mb-6 whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
              {policy}
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Última actualización: Marzo 2026
            </p>
            <p className="text-xs text-gray-400">
              Si tienes dudas sobre nuestro tratamiento de datos, puedes contactarnos en: info@controlhorario.es
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
