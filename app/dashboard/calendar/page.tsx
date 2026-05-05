'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { createClientComponent } from '@/lib/supabase';
import CalendarEventModal from '@/components/CalendarEventModal';

moment.locale('es');
const localizer = momentLocalizer(moment);

interface Appointment {
  id: string;
  patient_id: string | null;
  phone_number: string;
  service_type: string;
  appointment_date: string;
  status: 'pending' | 'scheduled' | 'cancelled' | 'completed' | 'no_show';
  reminder_sent: boolean;
  notes: string | null;
  patients?: {
    full_name: string | null;
  } | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

// Duración por servicio en minutos
const SERVICE_DURATIONS: Record<string, number> = {
  LIMPIEZA: 45,
  CONSULTA: 30,
  BLANQUEAMIENTO: 60,
  ORTODONCIA: 45,
  EXTRACCION: 30,
  URGENCIA: 20,
};

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>(Views.WEEK);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const supabase = createClientComponent();

  const getAppointments = useCallback(async () => {
    try {
      let query = supabase
        .from('appointments')
        .select('*, patients(*)')
        .order('appointment_date', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, filter]);

  // Convertir appointments a eventos del calendario
  useEffect(() => {
    const calendarEvents = appointments.map((apt) => {
      const startTime = new Date(apt.appointment_date);
      const duration = SERVICE_DURATIONS[apt.service_type] || 30;
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      return {
        id: apt.id,
        title: apt.service_type,
        start: startTime,
        end: endTime,
        resource: apt,
      };
    });
    setEvents(calendarEvents);
  }, [appointments]);

  // Suscripción Realtime
  useEffect(() => {
    getAppointments();

    const channel = supabase
      .channel('appointments-calendar-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => getAppointments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, filter, getAppointments]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: 'completed' | 'no_show') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', appointmentId);

      if (error) throw error;
      getAppointments();
      handleCloseModal();
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;

    const style = {
      backgroundColor: '',
      borderRadius: '4px',
      opacity: 0.85,
      color: 'white',
      border: 'none',
      cursor: 'pointer',
    };

    switch (status) {
      case 'pending':
        style.backgroundColor = '#a855f7'; // purple-500
        break;
      case 'scheduled':
        style.backgroundColor = '#3b82f6'; // blue-500
        break;
      case 'completed':
        style.backgroundColor = '#22c55e'; // green-500
        break;
      case 'cancelled':
        style.backgroundColor = '#ef4444'; // red-500
        break;
      case 'no_show':
        style.backgroundColor = '#eab308'; // yellow-500
        break;
      default:
        style.backgroundColor = '#6b7280'; // gray-500
    }

    return { style };
  };

  const formats = {
    agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
      moment(start).format('DD MMM') + ' - ' + moment(end).format('DD MMM YYYY'),
    dayHeaderFormat: (date: Date) => moment(date).format('ddd DD'),
    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
      moment(start).format('DD MMM') + ' - ' + moment(end).format('DD MMM YYYY'),
    eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
      moment(start).format('HH:mm') + ' - ' + moment(end).format('HH:mm'),
    timeGutterFormat: (date: Date) => moment(date).format('HH:mm'),
  };

  const messages = {
    today: 'Hoy',
    previous: 'Anterior',
    next: 'Siguiente',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Cita',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Cargando calendario...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Calendario</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('scheduled')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'scheduled' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Programadas
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'completed' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Completadas
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'pending' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Pendientes
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 250px)' }}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          formats={formats}
          messages={messages}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          defaultView={Views.WEEK}
          min={new Date().setHours(8, 0, 0, 0)}
          max={new Date().setHours(20, 0, 0, 0)}
          step={15}
          timeslots={4}
        />
      </div>

      {selectedEvent && (
        <CalendarEventModal
          event={selectedEvent}
          onClose={handleCloseModal}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
