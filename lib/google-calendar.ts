import { calendar_v3, google } from 'googleapis';

/**
 * Integración con Google Calendar API
 * ENFOQUE SIMPLIFICADO: Solo autenticación con API Key, sin OAuth
 * El calendario del bot es donde se crean las citas (primary)
 * El dentista puede ver/editar las citas en su propio calendario
 */

// Mapeo de duraciones por servicio (en minutos)
export const SERVICE_DURATIONS: Record<string, number> = {
  'limpieza dental': 45,
  'limpieza': 45,
  'profilaxis': 45,
  'consulta general': 30,
  'consulta': 30,
  'revisión': 30,
  'blanqueamiento dental': 90,
  'blanqueamiento': 90,
  'ortodoncia': 60,
  'brackets': 60,
  'extracción dental': 45,
  'extracción': 45,
  'sacar muela': 45,
  'atención de urgencia': 30,
  'urgencia': 30,
  'urgencias dentales': 30,
  'urgencia dental': 30,
  'dolor de muelas': 30,
  'emergencia': 30,
};

// Interfaces
export interface GCEvent {
  id?: string;
  summary: string;
  description: string;
  start: { dateTime: string } | { date: string };
  end: { dateTime: string } | { date: string };
  attendees?: Array<{ email: string }>;
  extendedProperties?: {
    private?: {
      phone_number?: string;
      service_type?: string;
      appointment_id?: string;
    };
  };
}

export interface GCAppointment {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  duration: number;
  service_type: string;
  phone_number: string;
}

// Configuración
// Usamos 'primary' - el calendario del bot donde se crean las citas
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

// Autenticación con API Key (más simple que OAuth)
const GOOGLE_CALENDAR_API_KEY = process.env.GOOGLE_CALENDAR_API_KEY || '';

/**
 * Crear cliente autenticado con API Key
 */
export function getCalendarClient(): calendar_v3.Calendar {
  if (CALENDAR_ID === 'primary') {
    // Si se usa 'primary', usamos el endpoint con API Key (más simple)
    if (!GOOGLE_CALENDAR_API_KEY) {
      throw new Error('Google Calendar API Key not configured. Please set GOOGLE_CALENDAR_API_KEY environment variable.');
    }

    return calendar_v3.Calendar({
      auth: GOOGLE_CALENDAR_API_KEY,
    version: 'v3',
    calendarId: 'primary',
    });
  }

  // Si se requiere un calendario específico, se necesita OAuth
  // Por ahora, solo soportamos el enfoque simplificado
  throw new Error('Para configurar un calendario específico, consulta las instrucciones de OAuth. Actualmente solo soportamos el calendario principal (primary) con autenticación de API Key.');
}

/**
 * Crear cita en Google Calendar
 */
export async function createGCEvent(data: {
  service: string;
  phone: string;
  datetime: string;
  duration?: number;
}): Promise<GCEvent> {
  const client = getCalendarClient();
  const duration = data.duration || SERVICE_DURATIONS[data.service.toLowerCase()] || 30;

  const start = new Date(data.datetime);
  const end = new Date(start.getTime() + duration * 60000);

  const event: GCEvent = {
    summary: `${data.service} - ${data.phone}`,
    description: `Cita dental: ${data.service}\nTeléfono: ${data.phone}\nAgendado vía WhatsApp Bot`,
    start: {
      dateTime: start.toISOString(),
      timeZone: 'America/Tijuana',
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: 'America/Tijuana',
    },
    extendedProperties: {
      private: {
        phone_number: data.phone,
        service_type: data.service,
      },
    },
  };

  const response = await client.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return response.data;
}

/**
 * Cancelar cita en Google Calendar
 */
export async function cancelGCEvent(eventId: string): Promise<boolean> {
  try {
    const client = getCalendarClient();
    await client.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    return true;
  } catch (error) {
    console.error('Error cancelando evento en Google Calendar:', error);
    return false;
  }
}

/**
 * Reagendar cita en Google Calendar
 */
export async function rescheduleGCEvent(
  eventId: string,
  newDatetime: string,
  duration: number
): Promise<GCEvent> {
  const client = getCalendarClient();
  const start = new Date(newDatetime);
  const end = new Date(start.getTime() + duration * 60000);

  const event = {
    start: {
      dateTime: start.toISOString(),
      timeZone: 'America/Tijuana',
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: 'America/Tijuana',
    },
  };

  const response = await client.events.patch({
    calendarId: 'primary',
    eventId: eventId,
    requestBody: event,
  });

  return response.data;
}

/**
 * Obtener disponibilidad de horarios
 */
export async function getGCAvailability(
  date: string,
  duration: number
): Promise<{ start: string; end: string }[]> {
  const client = getCalendarClient();

  // Consultar eventos del día
  const startOfDay = new Date(date);
  startOfDay.setHours(8, 0, 0, 0); // 8 AM

  const endOfDay = new Date(date);
  endOfDay.setHours(20, 0, 0, 0); // 8 PM

  const response = await client.events.list({
    calendarId: 'primary',
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  // Calcular espacios libres entre eventos
  const events = response.data.items || [];
  const timeSlots: { start: string; end: string }[] = [];

  let currentTime = startOfDay.getTime();

  for (const event of events) {
    const eventStart = event.start?.dateTime || event.start?.date
      ? new Date(event.start.dateTime || event.start.date || '').getTime()
      : 0;

    const eventEnd = event.end?.dateTime || event.end?.date
      ? new Date(event.end.dateTime || event.end.date || '').getTime()
      : 0;

    if (currentTime < eventStart && eventEnd - currentTime >= duration * 60000) {
      timeSlots.push({
        start: new Date(currentTime).toISOString(),
        end: new Date(Math.min(eventStart, currentTime + duration * 60000)).toISOString(),
      });
    }

    currentTime = eventEnd;
  }

  // Espacio después del último evento
  if (currentTime < endOfDay.getTime() && endOfDay.getTime() - currentTime >= duration * 60000) {
    timeSlots.push({
      start: new Date(currentTime).toISOString(),
      end: new Date(Math.min(endOfDay.getTime(), currentTime + duration * 60000)).toISOString(),
    });
  }

  return timeSlots;
}

/**
 * Obtener eventos del paciente (por teléfono en extendedProperties)
 */
export async function getGCEventsByPhone(phone: string): Promise<GCEvent[]> {
  const client = getCalendarClient();

  const response = await client.events.list({
    calendarId: 'primary',
    singleEvents: true,
    orderBy: 'startTime',
    timeMin: new Date().toISOString(),
  });

  return (response.data.items || []).filter(event => {
    const phone = event.extendedProperties?.private?.phone_number;
    return phone === phone;
  });
}

/**
 * Formatear fecha para mostrar al usuario
 */
export function formatGCDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Obtener duración de servicio
 */
export function getGCDuration(serviceType: string): number {
  return SERVICE_DURATIONS[serviceType.toLowerCase()] || 30;
}
