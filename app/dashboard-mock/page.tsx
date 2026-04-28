'use client';

import { useState } from 'react';
import Link from 'next/link';
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

// Mock data
const mockData = {
  totalPatients: 156,
  totalAppointments: 423,
  activeConversations: 48,
  totalMessages: 2156,
  conversionRate: 38,
  avgResponseTime: 7,
  noShowRate: 12,
  retentionRate: 67,
  appointmentsByStatus: [
    { name: 'Pendientes', value: 34, color: '#8b5cf6' },
    { name: 'Programadas', value: 156, color: '#3b82f6' },
    { name: 'Completadas', value: 187, color: '#10b981' },
    { name: 'Canceladas', value: 28, color: '#ef4444' },
    { name: 'No Show', value: 18, color: '#f59e0b' },
  ],
  appointmentsByService: [
    { name: 'Limpieza', value: 142 },
    { name: 'Consulta', value: 98 },
    { name: 'Ortodoncia', value: 67 },
    { name: 'Blanqueamiento', value: 54 },
    { name: 'Extracción', value: 38 },
    { name: 'Urgencia', value: 24 },
  ],
  appointmentsByDay: [
    { name: 'Lun', value: 78 },
    { name: 'Mar', value: 92 },
    { name: 'Mié', value: 85 },
    { name: 'Jue', value: 88 },
    { name: 'Vie', value: 65 },
    { name: 'Sáb', value: 15 },
  ],
  appointmentsTrend: [
    { name: 'Lun 14', value: 12 },
    { name: 'Mar 15', value: 15 },
    { name: 'Mié 16', value: 13 },
    { name: 'Jue 17', value: 18 },
    { name: 'Vie 18', value: 14 },
    { name: 'Sáb 19', value: 8 },
    { name: 'Dom 20', value: 6 },
    { name: 'Lun 21', value: 16 },
    { name: 'Mar 22', value: 19 },
    { name: 'Mié 23', value: 14 },
    { name: 'Jue 24', value: 17 },
    { name: 'Vie 25', value: 15 },
    { name: 'Sáb 26', value: 9 },
    { name: 'Dom 27', value: 7 },
  ],
  topQuestions: [
    { question: 'Agendar cita', count: 342 },
    { question: '¿Qué día es mi cita?', count: 156 },
    { question: 'Cancelar cita', count: 87 },
    { question: 'Precios', count: 72 },
    { question: 'Horarios', count: 54 },
  ],
  recentPatients: [
    { name: 'María González', phone: '+52 664 123 4567', appointments: 3, messages: 12, status: 'Activo', lastMessage: '¿A qué hora es mi cita del viernes?' },
    { name: 'Carlos Rodríguez', phone: '+52 664 234 5678', appointments: 1, messages: 5, status: 'Nuevo', lastMessage: 'Quiero agendar una limpieza' },
    { name: 'Ana López', phone: '+52 664 345 6789', appointments: 2, messages: 8, status: 'Activo', lastMessage: 'Gracias por la información' },
    { name: 'Roberto Martínez', phone: '+52 664 456 7890', appointments: 4, messages: 18, status: 'Activo', lastMessage: '¿Cuánto cuesta el blanqueamiento?' },
    { name: 'Laura Sánchez', phone: '+52 664 567 8901', appointments: 1, messages: 4, status: 'Nuevo', lastMessage: 'Necesito una consulta de urgencia' },
    { name: 'Pedro Hernández', phone: '+52 664 678 9012', appointments: 2, messages: 9, status: 'Activo', lastMessage: 'Puedo reagendar mi cita?' },
    { name: 'Sofía Ramírez', phone: '+52 664 789 0123', appointments: 5, messages: 22, status: 'Activo', lastMessage: '¿Tienen disponibilidad el sábado?' },
    { name: 'Miguel Torres', phone: '+52 664 890 1234', appointments: 1, messages: 3, status: 'Nuevo', lastMessage: 'Hola, quiero información' },
  ],
};

export default function DashboardMockPage() {
  const [dateRange, setDateRange] = useState('30d');

  const appointmentsByDayData = {
    labels: mockData.appointmentsByDay.map(d => d.name),
    datasets: [{
      label: 'Citas',
      data: mockData.appointmentsByDay.map(d => d.value),
      backgroundColor: 'rgba(249, 115, 22, 0.5)',
      borderColor: 'rgba(249, 115, 22, 1)',
      borderWidth: 2,
    }]
  };

  const appointmentsByServiceData = {
    labels: mockData.appointmentsByService.map(d => d.name),
    datasets: [{
      data: mockData.appointmentsByService.map(d => d.value),
      backgroundColor: ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b'],
    }]
  };

  const appointmentsByStatusData = {
    labels: mockData.appointmentsByStatus.map(d => d.name),
    datasets: [{
      data: mockData.appointmentsByStatus.map(d => d.value),
      backgroundColor: mockData.appointmentsByStatus.map(d => d.color),
    }]
  };

  const appointmentsTrendData = {
    labels: mockData.appointmentsTrend.map(d => d.name),
    datasets: [{
      label: 'Citas',
      data: mockData.appointmentsTrend.map(d => d.value),
      borderColor: 'rgba(249, 115, 22, 1)',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    }]
  };

  const topQuestionsData = {
    labels: mockData.topQuestions.map(q => q.question),
    datasets: [{
      label: 'Frecuencia',
      data: mockData.topQuestions.map(q => q.count),
      backgroundColor: 'rgba(139, 92, 246, 0.5)',
      borderColor: 'rgba(139, 92, 246, 1)',
      borderWidth: 2,
    }]
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🦷</span>
            </div>
            <div>
              <h1 className="font-bold text-white">Clínica Dental Sonrisa</h1>
              <p className="text-xs text-gray-400">Dashboard (Demo - Sin conexión a BD)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard-mock"
              className="text-orange-400 hover:text-orange-300 text-sm font-medium"
            >
              📊 Analytics
            </Link>
            <Link
              href="/test"
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Volver
            </Link>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Date Range Selector */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Analíticas</h2>
            <p className="text-gray-400">Métricas del bot WhatsApp (Datos de ejemplo)</p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="all">Todo el tiempo</option>
          </select>
        </div>

        {/* Primary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Pacientes Totales"
            value={mockData.totalPatients}
            icon="👥"
            trend="+12%"
            color="blue"
          />
          <StatCard
            title="Citas Agendadas"
            value={mockData.totalAppointments}
            icon="📅"
            trend="+8%"
            color="green"
          />
          <StatCard
            title="Conversaciones Activas"
            value={mockData.activeConversations}
            icon="💬"
            subtitle="Últimos 7 días"
            color="purple"
          />
          <StatCard
            title="Tasa de Conversión"
            value={`${mockData.conversionRate}%`}
            icon="📈"
            subtitle="Meta: 35%"
            color="orange"
          />
        </div>

        {/* Secondary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SecondaryStatCard title="Mensajes Totales" value={mockData.totalMessages} icon="💭" />
          <SecondaryStatCard title="Tiempo Resp. Promedio" value={`${mockData.avgResponseTime}s`} icon="⚡" />
          <SecondaryStatCard title="Tasa No-Show" value={`${mockData.noShowRate}%`} icon="🚫" />
          <SecondaryStatCard title="Tasa Retención" value={`${mockData.retentionRate}%`} icon="🔄" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
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
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
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
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
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
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Pacientes Recientes con Historial</h3>
            <span className="text-gray-400 text-sm">{mockData.recentPatients.length} pacientes</span>
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
                  <th className="text-left p-3 text-gray-400 font-medium">Último Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {mockData.recentPatients.map((patient, idx) => (
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
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>💡</span> Insights y Recomendaciones
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InsightCard
              icon="📅"
              title="Optimización de Horarios"
              color="orange"
              content="Martes es el día con más citas (92). Considera agregar disponibilidad los fines de semana que tienen menor demanda."
            />
            <InsightCard
              icon="🎯"
              title="Servicio Principal"
              color="blue"
              content="Limpieza representa el 34% de las citas. Crea paquetes promocionales combinados con blanqueamiento."
            />
            <InsightCard
              icon="✅"
              title="Conversión"
              color="green"
              content="Tasa de conversión del 38%. ¡Excelente desempeño! Supera la meta del 35%."
            />
            <InsightCard
              icon="⚠️"
              title="No-Show Rate"
              color="yellow"
              content="12% de inasistencias. Nivel aceptable, pero considera recordatorios 24h antes para reducir más."
            />
            <InsightCard
              icon="❓"
              title="Preguntas Frecuentes"
              color="purple"
              content="'Agendar cita' es la pregunta más común. El bot está funcionando bien para este propósito."
            />
            <InsightCard
              icon="👥"
              title="Retención"
              color="pink"
              content="67% de retención. Buen nivel, pero considera programa de fidelización para pacientes recurrentes."
            />
          </div>
        </div>

        {/* Notice */}
        <div className="mt-8 bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="font-semibold text-yellow-400 mb-2">Modo Demo - Sin conexión a base de datos</h4>
              <p className="text-yellow-200/80 text-sm">
                Esta página muestra datos de ejemplo para visualizar la interfaz. Los datos reales estarán disponibles cuando se configure la conexión a Supabase en el entorno de producción.
              </p>
            </div>
          </div>
        </div>
      </main>
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
  const colorClasses: Record<string, string> = {
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
  const colorClasses: Record<string, string> = {
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
