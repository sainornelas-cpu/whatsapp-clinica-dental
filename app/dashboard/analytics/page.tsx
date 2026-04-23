'use client';

import { useEffect, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';

interface Analytics {
  totalPatients: number;
  totalAppointments: number;
  appointmentsThisWeek: number;
  cancellationRate: number;
  serviceCounts: { [key: string]: number };
  upcomingAppointments: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponent();

  useEffect(() => {
    loadAnalytics();
  }, [supabase]);

  const loadAnalytics = async () => {
    try {
      // Get total patients
      const { count: totalPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // Get total appointments
      const { count: totalAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      // Get appointments this week
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { count: appointmentsThisWeek } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('appointment_date', weekAgo.toISOString());

      // Get cancelled appointments
      const { count: cancelledCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled');

      // Get upcoming appointments
      const { count: upcomingAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .gte('appointment_date', now.toISOString());

      // Get service counts
      const { data: appointments } = await supabase
        .from('appointments')
        .select('service_type');

      const serviceCounts: { [key: string]: number } = {};
      appointments?.forEach((apt: any) => {
        serviceCounts[apt.service_type] = (serviceCounts[apt.service_type] || 0) + 1;
      });

      const cancellationRate = totalAppointments ? (cancelledCount || 0) / totalAppointments * 100 : 0;

      setAnalytics({
        totalPatients: totalPatients || 0,
        totalAppointments: totalAppointments || 0,
        appointmentsThisWeek: appointmentsThisWeek || 0,
        cancellationRate: cancellationRate,
        serviceCounts,
        upcomingAppointments: upcomingAppointments || 0,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Cargando analítica...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Error al cargar analítica</div>
      </div>
    );
  }

  const sortedServices = Object.entries(analytics.serviceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Analítica</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de pacientes"
          value={analytics.totalPatients}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Citas esta semana"
          value={analytics.appointmentsThisWeek}
          icon="📅"
          color="green"
        />
        <StatCard
          title="Tasa de cancelación"
          value={`${analytics.cancellationRate.toFixed(1)}%`}
          icon="📉"
          color="red"
        />
        <StatCard
          title="Próximas citas"
          value={analytics.upcomingAppointments}
          icon="⏰"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Servicios más solicitados</h2>
          {sortedServices.length === 0 ? (
            <p className="text-gray-500">No hay datos disponibles</p>
          ) : (
            <div className="space-y-3">
              {sortedServices.map(([service, count]) => {
                const percentage = analytics.totalAppointments ? (count / analytics.totalAppointments) * 100 : 0;
                return (
                  <div key={service}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{service}</span>
                      <span className="text-gray-400">{count} citas ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Resumen general</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-750 rounded-lg">
              <span className="text-gray-400">Total de citas</span>
              <span className="text-2xl font-bold text-white">{analytics.totalAppointments}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-750 rounded-lg">
              <span className="text-gray-400">Servicios diferentes</span>
              <span className="text-2xl font-bold text-white">{Object.keys(analytics.serviceCounts).length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-750 rounded-lg">
              <span className="text-gray-400">Pacientes registrados</span>
              <span className="text-2xl font-bold text-white">{analytics.totalPatients}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number | string; icon: string; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    orange: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}