'use client';

import { useEffect, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';

export default function DashboardSimplePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClientComponent();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [patientsCount, appointmentsCount] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        patients: patientsCount.count || 0,
        appointments: appointmentsCount.count || 0,
      });
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard (Simple)</h1>
            <p className="text-gray-400">Sin protección de autenticación</p>
          </div>
          <div className="flex gap-2">
            <a href="/dashboard-mock" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">
              Dashboard Mock
            </a>
            <a href="/diagnose" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
              Diagnóstico
            </a>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-2">Pacientes</div>
              <div className="text-4xl font-bold text-white">{stats.patients}</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-2">Citas</div>
              <div className="text-4xl font-bold text-white">{stats.appointments}</div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-green-500/20 border border-green-500/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-400 mb-2">✅ Estado</h3>
          <p className="text-green-200">
            Esta página se cargó correctamente sin autenticación.
            Si ves esto, el problema está en el DashboardGuard que protege /dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
