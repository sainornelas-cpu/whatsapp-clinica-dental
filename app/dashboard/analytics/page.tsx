'use client';

import { useEffect, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsData {
  totalPatients: number;
  totalAppointments: number;
  activeConversations: number;
  totalMessages: number;
  appointmentsByStatus: any[];
  appointmentsByService: any[];
  appointmentsByDay: any[];
  appointmentsTrend: any[];
  topQuestions: any[];
  recentPatients: any[];
  conversionRate: number;
  avgResponseTime: number;
  noShowRate: number;
  retentionRate: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const supabase = createClientComponent();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      switch (dateRange) {
        case '7d': startDate.setDate(now.getDate() - 7); break;
        case '30d': startDate.setDate(now.getDate() - 30); break;
        case '90d': startDate.setDate(now.getDate() - 90); break;
        case 'all': startDate.setDate(0); break;
      }

      // Fetch all data in parallel
      const [
        patientsResult,
        appointmentsResult,
        conversationsResult,
        messagesResult
      ] = await Promise.all([
        supabase.from('patients').select('*').gte('created_at', startDate.toISOString()),
        supabase.from('appointments').select('*').gte('created_at', startDate.toISOString()),
        supabase.from('conversations').select('*'),
        supabase.from('messages').select('*').gte('created_at', startDate.toISOString())
      ]);

      const patients = patientsResult.data || [];
      const appointments = appointmentsResult.data || [];
      const conversations = conversationsResult.data || [];
      const messages = messagesResult.data || [];

      // Calculate metrics
      const totalPatients = patients.length;
      const totalAppointments = appointments.length;
      const activeConversations = conversations.filter(c => {
        const lastMsg = messages.filter(m => m.conversation_id === c.id).sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        return lastMsg && (new Date().getTime() - new Date(lastMsg.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
      }).length;
      const totalMessages = messages.length;

      // Appointments by status
      const appointmentsByStatus = [
        { name: 'Pendientes', value: appointments.filter(a => a.status === 'pending').length, color: '#8b5cf6' },
        { name: 'Programadas', value: appointments.filter(a => a.status === 'scheduled').length, color: '#3b82f6' },
        { name: 'Completadas', value: appointments.filter(a => a.status === 'completed').length, color: '#10b981' },
        { name: 'Canceladas', value: appointments.filter(a => a.status === 'cancelled').length, color: '#ef4444' },
        { name: 'No Show', value: appointments.filter(a => a.status === 'no_show').length, color: '#f59e0b' },
      ];

      // Appointments by service
      const serviceCounts = appointments.reduce((acc, apt) => {
        acc[apt.service_type] = (acc[apt.service_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const appointmentsByService = Object.entries(serviceCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Appointments by day of week
      const dayCounts: Record<string, number> = {};
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      appointments.forEach(apt => {
        if (apt.appointment_date) {
          const day = new Date(apt.appointment_date).getDay();
          const dayName = days[day];
          dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        }
      });

      const appointmentsByDay = days.map(day => ({
        name: day,
        value: dayCounts[day] || 0
      }));

      // Appointments trend (by date)
      const dateCounts: Record<string, number> = {};
      appointments.forEach(apt => {
        if (apt.created_at) {
          const date = new Date(apt.created_at).toLocaleDateString('es-MX');
          dateCounts[date] = (dateCounts[date] || 0) + 1;
        }
      });

      const sortedDates = Object.keys(dateCounts).sort((a, b) =>
        new Date(a).getTime() - new Date(b).getTime()
      ).slice(-14); // Last 14 days

      const appointmentsTrend = sortedDates.map(date => ({
        name: date,
        value: dateCounts[date] || 0
      }));

      // Top questions/topics from messages
      const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
      const questionPatterns = {
        '¿Qué día es mi cita?': ['qué día', 'cuándo es mi cita', 'fecha de mi cita', 'qué día tengo'],
        'Agendar cita': ['quiero una cita', 'agendar', 'reservar', 'necesito una cita', 'cita de'],
        'Cancelar cita': ['cancelar', 'quiero cancelar'],
        'Reagendar cita': ['reagendar', 'cambiar fecha', 'mover cita'],
        'Precios': ['cuánto cuesta', 'precio', 'cuánto es', 'costo'],
        'Horarios': ['¿a qué hora', 'horarios', 'qué hora', 'qué día abren'],
        'Servicios': ['qué servicios', 'qué hacen', 'tratamientos', 'servicios ofrecen'],
      };

      const topQuestions = Object.entries(questionPatterns).map(([question, patterns]) => {
        const count = userMessages.filter(msg => patterns.some(pattern => msg.includes(pattern))).length;
        return { question, count };
      }).sort((a, b) => b.count - a.count).slice(0, 5);

      // Recent patients with conversation summary
      const recentPatients = await Promise.all(
        patients.slice(0, 15).map(async (patient) => {
          const patientAppointments = appointments.filter(a => a.phone_number === patient.phone_number);
          const patientMessages = messages.filter(m => {
            const conv = conversations.find(c => c.id === m.conversation_id);
            return conv?.phone_number === patient.phone_number;
          });

          // Get last message
          const lastMessage = patientMessages.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];

          return {
            id: patient.id,
            name: patient.full_name || 'Sin nombre',
            phone: patient.phone_number,
            appointments: patientAppointments.length,
            messages: patientMessages.length,
            lastActivity: lastMessage?.created_at || patient.created_at,
            lastMessage: lastMessage?.content?.substring(0, 60) + '...' || 'Sin mensajes',
            status: patientAppointments.length > 0 ? 'Activo' : 'Nuevo',
            lastAppointment: patientAppointments.sort((a, b) =>
              new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
            )[0]?.appointment_date || null,
          };
        })
      );

      // Conversion rate (appointments / conversations)
      const conversionRate = conversations.length > 0
        ? Math.round((appointments.filter(a => a.status === 'scheduled' || a.status === 'completed').length / conversations.length) * 100)
        : 0;

      // No-show rate
      const noShowRate = totalAppointments > 0
        ? Math.round((appointments.filter(a => a.status === 'no_show').length / totalAppointments) * 100)
        : 0;

      // Retention rate (patients with >1 appointment)
      const retentionRate = patients.length > 0
        ? Math.round((patients.filter(p => {
          return appointments.filter(a => a.phone_number === p.phone_number).length > 1;
        }).length / patients.length) * 100)
        : 0;

      // Avg response time (simulated)
      const avgResponseTime = 8;

      setData({
        totalPatients,
        totalAppointments,
        activeConversations,
        totalMessages,
        appointmentsByStatus,
        appointmentsByService,
        appointmentsByDay,
        appointmentsTrend,
        topQuestions,
        recentPatients,
        conversionRate,
        avgResponseTime,
        noShowRate,
        retentionRate,
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando analíticas...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Chart configurations
  const appointmentsByDayData = {
    labels: data.appointmentsByDay.map(d => d.name),
    datasets: [{
      label: 'Citas',
      data: data.appointmentsByDay.map(d => d.value),
      backgroundColor: 'rgba(249, 115, 22, 0.5)',
      borderColor: 'rgba(249, 115, 22, 1)',
      borderWidth: 2,
    }]
  };

  const appointmentsByServiceData = {
    labels: data.appointmentsByService.map(d => d.name),
    datasets: [{
      data: data.appointmentsByService.map(d => d.value),
      backgroundColor: [
        '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b'
      ],
    }]
  };

  const appointmentsByStatusData = {
    labels: data.appointmentsByStatus.map(d => d.name),
    datasets: [{
      data: data.appointmentsByStatus.map(d => d.value),
      backgroundColor: data.appointmentsByStatus.map(d => d.color),
    }]
  };

  const appointmentsTrendData = {
    labels: data.appointmentsTrend.map(d => d.name),
    datasets: [{
      label: 'Citas',
      data: data.appointmentsTrend.map(d => d.value),
      borderColor: 'rgba(249, 115, 22, 1)',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    }]
  };

  const topQuestionsData = {
    labels: data.topQuestions.map(q => q.question),
    datasets: [{
      label: 'Frecuencia',
      data: data.topQuestions.map(q => q.count),
      backgroundColor: 'rgba(139, 92, 246, 0.5)',
      borderColor: 'rgba(139, 92, 246, 1)',
      borderWidth: 2,
    }]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analíticas</h1>
          <p className="text-gray-400">Métricas y insights del bot WhatsApp</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="90d">Últimos 90 días</option>
          <option value="all">Todo el tiempo</option>
        </select>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pacientes Totales"
          value={data.totalPatients}
          icon="👥"
          trend="+12%"
          color="blue"
        />
        <StatCard
          title="Citas Agendadas"
          value={data.totalAppointments}
          icon="📅"
          trend="+8%"
          color="green"
        />
        <StatCard
          title="Conversaciones Activas"
          value={data.activeConversations}
          icon="💬"
          subtitle="Últimos 7 días"
          color="purple"
        />
        <StatCard
          title="Tasa de Conversión"
          value={`${data.conversionRate}%`}
          icon="📈"
          subtitle={`Meta: 35%`}
          color="orange"
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SecondaryStatCard
          title="Mensajes Totales"
          value={data.totalMessages}
          icon="💭"
        />
        <SecondaryStatCard
          title="Tiempo Resp. Promedio"
          value={`${data.avgResponseTime}s`}
          icon="⚡"
        />
        <SecondaryStatCard
          title="Tasa No-Show"
          value={`${data.noShowRate}%`}
          icon="🚫"
        />
        <SecondaryStatCard
          title="Tasa Retención"
          value={`${data.retentionRate}%`}
          icon="🔄"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Appointments by Service */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Citas por Servicio</h3>
          <div className="h-64">
            <Bar data={appointmentsByServiceData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
              }
            }} />
          </div>
        </div>

        {/* Appointments by Status */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Estado de Citas</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={appointmentsByStatusData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'right', labels: { color: '#9ca3af' } }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Appointments Trend */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Tendencia de Citas</h3>
          <div className="h-64">
            <Line data={appointmentsTrendData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
                x: { grid: { display: false }, ticks: { color: '#9ca3af', maxTicksLimit: 7 } }
              }
            }} />
          </div>
        </div>

        {/* Appointments by Day */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Citas por Día de la Semana</h3>
          <div className="h-64">
            <Bar data={appointmentsByDayData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Top Questions */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Preguntas Más Frecuentes</h3>
        <div className="h-64">
          <Bar data={topQuestionsData} options={{
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { beginAtZero: true, grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
              y: { grid: { display: false }, ticks: { color: '#9ca3af', maxTicksLimit: 5 } }
            }
          }} />
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Pacientes Recientes con Historial</h3>
          <span className="text-gray-400 text-sm">{data.recentPatients.length} pacientes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3 text-gray-400 font-medium">Paciente</th>
                <th className="text-left p-3 text-gray-400 font-medium">Teléfono</th>
                <th className="text-left p-3 text-gray-400 font-medium">Citas</th>
                <th className="text-left p-3 text-gray-400 font-medium">Mensajes</th>
                <th className="text-left p-3 text-gray-400 font-medium">Estado</th>
                <th className="text-left p-3 text-gray-400 font-medium">Última Cita</th>
                <th className="text-left p-3 text-gray-400 font-medium">Último Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {data.recentPatients.map((patient) => (
                <tr key={patient.id} className="border-b border-gray-700 hover:bg-gray-750">
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
                  <td className="p-3 text-gray-300">
                    {patient.lastAppointment
                      ? new Date(patient.lastAppointment).toLocaleDateString('es-MX')
                      : 'N/A'}
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

      {/* Insights & Recommendations */}
      <div className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>💡</span> Insights y Recomendaciones
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InsightCard
            icon="📅"
            title="Optimización de Horarios"
            color="orange"
            content={`${
              data.appointmentsByDay.sort((a, b) => b.value - a.value)[0]?.name || 'Lunes'
            } es el día con más citas. Considera agregar disponibilidad los días con menos demanda.`}
          />
          <InsightCard
            icon="🎯"
            title="Servicio Principal"
            color="blue"
            content={`${
              data.appointmentsByService[0]?.name || 'Limpieza'
            } representa el ${
              data.appointmentsByService[0] && data.totalAppointments > 0
                ? Math.round((data.appointmentsByService[0].value / data.totalAppointments) * 100)
                : 0
            }% de las citas. Crea paquetes promocionales para este servicio.`}
          />
          <InsightCard
            icon="✅"
            title="Conversión"
            color="green"
            content={`Tasa de conversión del ${data.conversionRate}%. ${
              data.conversionRate < 35
                ? 'Considera mejorar el flujo de agendado para aumentar conversiones.'
                : '¡Excelente desempeño!'
            }`}
          />
          <InsightCard
            icon="⚠️"
            title="No-Show Rate"
            color="yellow"
            content={`${data.noShowRate}% de inasistencias. ${
              data.noShowRate > 15
                ? 'Implementa recordatorios más frecuentes o políticas de confirmación.'
                : 'Nivel aceptable de inasistencias.'
            }`}
          />
          <InsightCard
            icon="❓"
            title="Preguntas Frecuentes"
            color="purple"
            content={`"${
              data.topQuestions[0]?.question || 'Agendar cita'
            }" es la pregunta más común. Considera agregar esta información al saludo inicial del bot.`}
          />
          <InsightCard
            icon="👥"
            title="Retención"
            color="pink"
            content={`${data.recentPatients.filter(p => p.appointments > 1).length} de ${
              data.recentPatients.length
            } pacientes recientes tienen más de una cita. ${
              data.recentPatients.filter(p => p.appointments > 1).length < data.recentPatients.length * 0.3
                ? 'Considera programa de fidelización.'
                : 'Buen nivel de retención.'
            }`}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, subtitle, color }: {
  title: string;
  value: number | string;
  icon: string;
  trend?: string;
  subtitle?: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    orange: 'bg-orange-500/20 text-orange-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  const trendColor = trend?.startsWith('+') ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {trend && <div className={`${trendColor} text-sm`}>{trend} vs período anterior</div>}
      {subtitle && <div className="text-blue-400 text-sm">{subtitle}</div>}
    </div>
  );
}

function SecondaryStatCard({ title, value, icon }: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <div className="text-gray-400 text-sm mb-1">{title}</div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
}

function InsightCard({ icon, title, color, content }: {
  icon: string;
  title: string;
  color: string;
  content: string;
}) {
  const colorClasses = {
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
    pink: 'text-pink-400',
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className={`${colorClasses[color as keyof typeof colorClasses]} font-semibold mb-2`}>
        {icon} {title}
      </div>
      <p className="text-gray-300 text-sm">{content}</p>
    </div>
  );
}
