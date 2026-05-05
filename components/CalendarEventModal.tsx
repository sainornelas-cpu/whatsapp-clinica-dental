'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface CalendarEventModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onStatusUpdate: (appointmentId: string, newStatus: 'completed' | 'no_show') => void;
}

export default function CalendarEventModal({ event, onClose, onStatusUpdate }: CalendarEventModalProps) {
  const router = useRouter();
  const apt = event.resource;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'no_show':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'scheduled':
        return 'Programada';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      case 'no_show':
        return 'No asistió';
      default:
        return status;
    }
  };

  const handleViewConversation = () => {
    onClose();
    router.push(`/dashboard/conversations?phone=${apt.phone_number}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full shadow-2xl border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Detalles de la Cita</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-400">Paciente</p>
            <p className="text-lg font-medium text-white">
              {apt.patients?.full_name || 'Desconocido'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-400">Teléfono</p>
            <p className="text-white">{apt.phone_number}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-400">Servicio</p>
            <p className="text-white font-medium">{apt.service_type}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-400">Fecha y hora</p>
            <p className="text-white">{formatDate(apt.appointment_date)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-400">Estado</p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(apt.status)}`}>
              {getStatusLabel(apt.status)}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-400">Recordatorio</p>
            {apt.reminder_sent ? (
              <span className="text-green-400">✓ Enviado</span>
            ) : (
              <span className="text-gray-500">Pendiente</span>
            )}
          </div>

          {apt.notes && (
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Notas</p>
              <p className="text-gray-300 bg-gray-900 rounded p-3 text-sm">{apt.notes}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 space-y-3">
          <Link
            href={`/dashboard/conversations?phone=${apt.phone_number}`}
            className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-center font-medium"
          >
            Ver conversación
          </Link>

          {apt.status === 'scheduled' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onStatusUpdate(apt.id, 'completed')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                Completar
              </button>
              <button
                onClick={() => onStatusUpdate(apt.id, 'no_show')}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium"
              >
                No asistió
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
