// Mapeo de servicios dentales a Cal.com event type IDs
// Los valores deben ser reemplazados con los event type IDs reales de tu cuenta de Cal.com

// URLs de los eventos de Cal.com:
// - Limpieza Dental Profesional: https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/limpieza-dental-profesional
// - Consulta General: https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/consulta-general
// - Blanqueamiento Dental: https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/blanqueamiento-dental
// - Ortodoncia: https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/ortodoncia
// - Extracción Dental: https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/extraccion-dental
// - Atención de Urgencia: https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/atencion-de-urgencia

export const CAL_EVENT_TYPES: Record<string, { eventTypeId: string; duration: number }> = {
  // Limpieza Dental Profesional
  'limpieza dental profesional': {
    eventTypeId: process.env.CAL_EVENT_TYPE_LIMPIEZA || '',
    duration: 45, // minutos
  },
  'limpieza dental': {
    eventTypeId: process.env.CAL_EVENT_TYPE_LIMPIEZA || '',
    duration: 45,
  },
  'limpieza': {
    eventTypeId: process.env.CAL_EVENT_TYPE_LIMPIEZA || '',
    duration: 45,
  },
  'profilaxis': {
    eventTypeId: process.env.CAL_EVENT_TYPE_LIMPIEZA || '',
    duration: 45,
  },

  // Consulta General
  'consulta general': {
    eventTypeId: process.env.CAL_EVENT_TYPE_CONSULTA || '',
    duration: 30,
  },
  'consulta de revisión general': {
    eventTypeId: process.env.CAL_EVENT_TYPE_CONSULTA || '',
    duration: 30,
  },
  'consulta de revisión': {
    eventTypeId: process.env.CAL_EVENT_TYPE_CONSULTA || '',
    duration: 30,
  },
  'consulta': {
    eventTypeId: process.env.CAL_EVENT_TYPE_CONSULTA || '',
    duration: 30,
  },
  'revisión': {
    eventTypeId: process.env.CAL_EVENT_TYPE_CONSULTA || '',
    duration: 30,
  },
  'chequeo': {
    eventTypeId: process.env.CAL_EVENT_TYPE_CONSULTA || '',
    duration: 30,
  },

  // Blanqueamiento Dental
  'blanqueamiento dental': {
    eventTypeId: process.env.CAL_EVENT_TYPE_BLANQUEAMIENTO || '',
    duration: 90,
  },
  'blanqueamiento': {
    eventTypeId: process.env.CAL_EVENT_TYPE_BLANQUEAMIENTO || '',
    duration: 90,
  },

  // Ortodoncia
  'ortodoncia': {
    eventTypeId: process.env.CAL_EVENT_TYPE_ORTODONCIA || '',
    duration: 60,
  },
  'brackets': {
    eventTypeId: process.env.CAL_EVENT_TYPE_ORTODONCIA || '',
    duration: 60,
  },

  // Extracción Dental
  'extracción dental': {
    eventTypeId: process.env.CAL_EVENT_TYPE_EXTRACCION || '',
    duration: 45,
  },
  'extracción simple': {
    eventTypeId: process.env.CAL_EVENT_TYPE_EXTRACCION || '',
    duration: 45,
  },
  'extracción': {
    eventTypeId: process.env.CAL_EVENT_TYPE_EXTRACCION || '',
    duration: 45,
  },
  'sacar muela': {
    eventTypeId: process.env.CAL_EVENT_TYPE_EXTRACCION || '',
    duration: 45,
  },

  // Atención de Urgencia
  'atención de urgencia': {
    eventTypeId: process.env.CAL_EVENT_TYPE_URGENCIA || '',
    duration: 30,
  },
  'atencion de urgencia': {
    eventTypeId: process.env.CAL_EVENT_TYPE_URGENCIA || '',
    duration: 30,
  },
  'urgencias dentales': {
    eventTypeId: process.env.CAL_EVENT_TYPE_URGENCIA || '',
    duration: 30,
  },
  'urgencia dental': {
    eventTypeId: process.env.CAL_EVENT_TYPE_URGENCIA || '',
    duration: 30,
  },
  'urgencia': {
    eventTypeId: process.env.CAL_EVENT_TYPE_URGENCIA || '',
    duration: 30,
  },
  'dolor de muelas': {
    eventTypeId: process.env.CAL_EVENT_TYPE_URGENCIA || '',
    duration: 30,
  },
  'emergencia': {
    eventTypeId: process.env.CAL_EVENT_TYPE_URGENCIA || '',
    duration: 30,
  },
};

// Función para obtener el event type ID y duración de un servicio
export function getCalEventType(serviceType: string): { eventTypeId: string; duration: number } | null {
  // Buscar coincidencia exacta
  const exactMatch = CAL_EVENT_TYPES[serviceType.toLowerCase()];
  if (exactMatch) return exactMatch;

  // Buscar coincidencia parcial
  const serviceLower = serviceType.toLowerCase();
  for (const [key, value] of Object.entries(CAL_EVENT_TYPES)) {
    if (serviceLower.includes(key) || key.includes(serviceLower)) {
      return value;
    }
  }

  // Si no se encuentra, usar el default (si está configurado)
  const defaultEventTypeId = process.env.CAL_EVENT_TYPE_ID;
  if (defaultEventTypeId) {
    return { eventTypeId: defaultEventTypeId, duration: 30 };
  }

  return null;
}

// Lista de servicios disponibles para mostrar al usuario
export const AVAILABLE_SERVICES = [
  'Limpieza dental profesional (45 min) - $800 MXN',
  'Consulta general (30 min) - $500 MXN',
  'Blanqueamiento dental (90 min) - $3,500 MXN',
  'Ortodoncia consulta inicial (60 min) - $800 MXN',
  'Extracción dental (45 min) - $1,200 MXN',
  'Atención de urgencia (30 min) - $600 MXN',
];
