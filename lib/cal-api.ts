// Cal.com API - Crear bookings directamente sin depender de webhook
import { randomUUID } from 'crypto';

const CAL_API_KEY = process.env.CAL_API_KEY;

// Cal.com Event Type IDs
const EVENT_TYPE_IDS: Record<string, number> = {
  'limpieza': 5472667,
  'limpieza dental': 5472667,
  'limpieza dental profesional': 5472667,
  'consulta': 5472670,
  'consulta general': 5472670,
  'revisión': 5472670,
  'blanqueamiento': 5472673,
  'blanqueamiento dental': 5472673,
  'ortodoncia': 5472679,
  'extracción': 5472681,
  'extracción dental': 5472681,
  'urgencia': 5472685,
  'atención de urgencia': 5472685,
  'urgencia dental': 5472685,
};

// Duración en minutos de cada servicio
const DURATION_MINUTES: Record<string, number> = {
  'limpieza': 45,
  'limpieza dental': 45,
  'limpieza dental profesional': 45,
  'consulta': 30,
  'consulta general': 30,
  'revisión': 30,
  'blanqueamiento': 90,
  'blanqueamiento dental': 90,
  'ortodoncia': 60,
  'extracción': 45,
  'extracción dental': 45,
  'urgencia': 30,
  'atención de urgencia': 30,
  'urgencia dental': 30,
};

export function getEventTypeId(serviceType: string): number | null {
  const serviceLower = serviceType.toLowerCase();

  // Buscar coincidencia exacta
  if (EVENT_TYPE_IDS[serviceLower]) {
    return EVENT_TYPE_IDS[serviceLower];
  }

  // Buscar coincidencia parcial
  for (const [key, id] of Object.entries(EVENT_TYPE_IDS)) {
    if (serviceLower.includes(key) || key.includes(serviceLower)) {
      return id;
    }
  }

  return null;
}

export function getDuration(serviceType: string): number {
  const serviceLower = serviceType.toLowerCase();
  return DURATION_MINUTES[serviceLower] || 30;
}

// Crear booking directamente en Cal.com usando la API
export async function createCalBooking(params: {
  eventTypeId: number;
  attendee: {
    name: string;
    email: string;
    timeZone: string;
    phoneNumber: string;
  };
  start: string; // ISO 8601 format, UTC
  duration?: number;
}) {
  try {
    const response = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
      },
      body: JSON.stringify({
        eventTypeId: params.eventTypeId,
        start: params.start,
        attendee: params.attendee,
        duration: params.duration || 30,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cal.com API error:', errorText);
      return { error: `Error creating booking: ${errorText}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error creating Cal.com booking:', error);
    return { error: 'Error al crear reserva en Cal.com' };
  }
}

// Obtener slots disponibles para un event type
export async function getAvailableSlots(params: {
  eventTypeId: number;
  start: string; // ISO 8601 format
  end: string; // ISO 8601 format
  timeZone?: string;
}) {
  try {
    const url = new URL('https://api.cal.com/v2/slots');
    url.searchParams.append('eventTypeId', params.eventTypeId.toString());
    url.searchParams.append('start', params.start);
    url.searchParams.append('end', params.end);
    if (params.timeZone) {
      url.searchParams.append('timeZone', params.timeZone);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'cal-api-version': '2024-08-13',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cal.com slots error:', errorText);
      return { error: `Error getting slots: ${errorText}` };
    }

    const data = await response.json();
    return { success: true, slots: data };
  } catch (error) {
    console.error('Error getting slots:', error);
    return { error: 'Error al obtener horarios disponibles' };
  }
}
