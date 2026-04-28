'use client';

import { useEffect, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';

export default function AnalyticsNoChartsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const supabase = createClientComponent();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const startDate = new Date();
      switch (dateRange) {
        case '7d': startDate.setDate(now.getDate() - 7); break;
        case '30d': startDate.setDate(now.getDate() - 30); break;
        case '90d': startDate.setDate(now.getDate() - 90); break;
        case 'all': startDate.setDate(0); break;
      }

      const [patients, appointments, conversations, messages] = await Promise.all([
        supabase.from('patients').select('*').gte('created_at', startDate.toISOString()),
        supabase.from('appointments').select('*').gte('created_at', startDate.toISOString()),
        supabase.from('conversations').select('*'),
        supabase.from('messages').select('*').gte('created_at', startDate.toISOString()),
      ]);

      const totalPatients = patients?.length || 0;
      const totalAppointments = appointments?.length || 0;
      const totalMessages = messages?.length || 0;

      // Calculate metrics
      const appointmentsByStatus = [
        { name: 'Pendientes', value: appointments.filter(a => a.status === 'pending').length, color: '#8b5cf6' },
        { name: 'Programadas', value: appointments.filter(a => a.status === 'scheduled').length, color: '#3b82f6' },
        { name: 'Completadas', value: appointments.filter(a => a.status === 'completed').length, color: '#10b981' },
        { name: 'Canceladas', value: appointments.filter(a => a.status === 'cancelled').length, color: '#ef4444' },
        { name: 'No Show', value: appointments.filter(a => a.status === 'no_show').length, color: '#f59e0b' },
      ];

      const serviceCounts = appointments.reduce((acc, apt) => {
        acc[apt.service_type] = (acc[apt.service_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const appointmentsByService = Object.entries(serviceCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const maxServiceValue = Math.max(...appointmentsByService.map(s => s.value), 1);

      // Top questions
      const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
      const questionPatterns = {
        '¿Qué día es mi cita?': ['qué día', 'cuándo es mi cita', 'fecha de mi cita'],
        'Agendar cita': ['quiero una cita', 'agendar', 'reservar', 'necesito una cita'],
        'Cancelar cita': ['cancelar', 'quiero cancelar'],
        'Reagendar cita': ['reagendar', 'cambiar fecha'],
        'Precios': ['cuánto cuesta', 'precio', 'cuánto es'],
        'Horarios': ['¿a qué hora', 'horarios'],
      };

      const topQuestions = Object.entries(questionPatterns).map(([question, patterns]) => {
        const count = userMessages.filter(msg => patterns.some(pattern => msg.includes(pattern))).length;
        return { question, count };
      }).sort((a, b) => b.count - a.count).slice(0, 5);

      // Recent patients
      const recentPatients = await Promise.all(
        (patients || []).slice(0, 10).map(async (patient) => {
          const patientAppointments = (appointments || []).filter(a => a.phone_number === patient.phone_number);
          const patientMessages = (messages || []).filter(m => {
            const conv = (conversations || []).find(c => c.id === m.conversation_id);
            return conv?.phone_number === patient.phone_number;
          });

          const lastMessage = patientMessages.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];

          return {
            name: patient.full_name || 'Sin nombre',
            phone: patient.phone_number,
            appointments: patientAppointments.length,
            messages: patientMessages.length,
            lastMessage: lastMessage?.content?.substring(0, 60) + '...' || 'Sin mensajes',
            status: patientAppointments.length > 0 ? 'Activo' : 'Nuevo',
          };
        })
      );

      // Calculate metrics
      const conversionRate = conversations.length > 0
        ? Math.round((appointments.filter(a => a.status === 'scheduled' || a.status === 'completed').length / conversations.length) * 100)
        : 0;

      const noShowRate = totalAppointments > 0
        ? Math.round((appointments.filter(a => a.status === 'no_show').length / totalAppointments) * 100)
        : 0;

      const retentionRate = patients.length > 0
        ? Math.round((patients.filter(p => {
          return (appointments || []).filter(a => a.phone_number === p.phone_number).length > 1;
        }).length / patients.length) * 100)
        : 0;

      setData({
        totalPatients,
        totalAppointments,
        totalMessages,
        activeConversations: (conversations || []).length,
        appointmentsByStatus,
        appointmentsByService,
        topQuestions,
        recentPatients,
        conversionRate,
        noShowRate,
        retentionRate,
        maxServiceValue,
      });

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando analíticas...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Error al cargar analíticas</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analíticas</h1>
            <p className="text-gray-400">Métricas del bot WhatsApp (Sin gráficos Chart.js)</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="all">Todo el tiempo</option>
            </select>
            <a
              href="/dashboard-mock"
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Dashboard Mock (con gráficos)
            </a>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard title="Pacientes Totales" value={data.totalPatients} icon="👥" trend="+12%" color="blue" />
          <KPICard title="Citas Agendadas" value={data.totalAppointments} icon="📅" trend="+8%" color="green" />
          <KPICard title="Tasa de Conversión" value={`${data.conversionRate}%`} icon="📈" subtitle="Meta: 35%" color="orange" />
          <KPICard title="Tasa No-Show" value={`${data.noShowRate}%`} icon="🚫" subtitle="Objetivo: &lt;15%" color={data.noShowRate > 15 ? 'red' : 'green'} />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SecondaryStatCard title="Mensajes Totales" value={data.totalMessages} icon="💭" />
          <SecondaryStatCard title="Tasa Retención" value={`${data.retentionRate}%`} icon="🔄" />
        </div>

        {/* Service Distribution (CSS Bar Chart) */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Citas por Servicio</h2>
          <div className="space-y-4">
            {data.appointmentsByService.map((service) => (
              <div key={service.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white capitalize">{service.name}</span>
                  <span className="text-gray-400">{service.value} citas ({Math.round((service.value / data.maxServiceValue) * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(service.value / data.maxServiceValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Appointments by Status */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Estado de Citas</h2>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  {data.appointmentsByStatus.map((item, index) => {
                    const total = data.appointmentsByStatus.reduce((sum, s) => sum + s.value, 0);
                    const prevTotal = data.appointmentsByStatus.slice(0, index).reduce((sum, s) => sum + s.value, 0);
                    const percentage = (item.value / total) * 100;
                    const circumference = 2 * Math.PI * 16;
                    const dashArray = `${(percentage / 100) * circumference} ${circumference}`;
                    const rotate = ((prevTotal / total) * 360) - 90;

                    return (
                      <circle
                        key={item.name}
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="4"
                        strokeDasharray={dashArray}
                        transform={`rotate(${rotate} 18 18)`}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{data.totalAppointments}</div>
                    <div className="text-xs text-gray-400">Total</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-6 space-y-2">
              {data.appointmentsByStatus.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-white">{item.name}</span>
                  <span className="text-gray-400 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Questions */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Preguntas Más Frecuentes</h2>
            <div className="space-y-3">
              {data.topQuestions.map((item, index) => {
                const maxCount = Math.max(...data.topQuestions.map(q => q.count), 1);
                return (
                  <div key={item.question}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{item.question}</span>
                      <span className="text-gray-400">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Pacientes Recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-400 font-medium">Paciente</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Teléfono</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Citas</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Mensajes</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Estado</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Último Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPatients.map((patient, idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="p-3 text-white font-medium">{patient.name}</td>
                    <td className="p-3 text-gray-300">{patient.phone}</td>
                    <td className="p-3 text-gray-300">{patient.appointments}</td>
                    <td className="p-3 text-gray-300">{patient.messages}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        patient.status === 'Activo'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 text-sm max-w-xs truncate">
                      {patient.lastMessage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>💡</span> Insights
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <InsightCard
              icon="🎯"
              title="Servicio Principal"
              content={`${data.appointmentsByService[0]?.name || 'N/A'} es el servicio más solicitado.`}
            />
            <InsightCard
              icon="✅"
              title="Conversión"
              content={`Tasa de ${data.conversionRate}%. ${data.conversionRate >= 35 ? '¡Excelente!' : 'Por debajo del objetivo (35%)'}`}
            />
            <InsightCard
              icon="👥"
              title="Retención"
              content={`${data.retentionRate}% de pacientes vuelven. ${data.retentionRate >= 60 ? 'Buen nivel de fidelización.' : 'Considera programa de recompensas.'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, trend, subtitle, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    orange: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {trend && <div className={trend.startsWith('+') ? 'text-green-400' : 'text-red-400'} text-sm">{trend}</div>}
      {subtitle && <div className={colorClasses[color as keyof typeof colorClasses]} text-sm>{subtitle}</div>}
    </div>
  );
}

function SecondaryStatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <div className="text-gray-400 text-sm mb-1">{title}</div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
}

function InsightCard({ icon, title, content }: { icon: string; title: string; content: string }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="text-orange-400 font-semibold mb-2">{icon} {title}</div>
      <p className="text-gray-300 text-sm">{content}</p>
    </div>
  );
}
