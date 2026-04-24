// Generación de links de booking de Cal.com
// En lugar de usar la API problemática de bookings, generamos links para que el usuario complete la reserva

const CAL_USER = 'alfredo-sain-ornelas-almeida-e6i0wr';

export const CAL_BOOKING_LINKS: Record<string, string> = {
  'limpieza dental': `https://cal.com/${CAL_USER}/limpieza-dental-profesional`,
  'limpieza': `https://cal.com/${CAL_USER}/limpieza-dental-profesional`,
  'consulta general': `https://cal.com/${CAL_USER}/consulta-general`,
  'consulta': `https://cal.com/${CAL_USER}/consulta-general`,
  'revisión': `https://cal.com/${CAL_USER}/consulta-general`,
  'blanqueamiento dental': `https://cal.com/${CAL_USER}/blanqueamiento-dental`,
  'blanqueamiento': `https://cal.com/${CAL_USER}/blanqueamiento-dental`,
  'ortodoncia': `https://cal.com/${CAL_USER}/ortodoncia`,
  'extracción dental': `https://cal.com/${CAL_USER}/extraccion-dental`,
  'extracción': `https://cal.com/${CAL_USER}/extraccion-dental`,
  'atención de urgencia': `https://cal.com/${CAL_USER}/atencion-de-urgencia`,
  'urgencia': `https://cal.com/${CAL_USER}/atencion-de-urgencia`,
  'urgencia dental': `https://cal.com/${CAL_USER}/atencion-de-urgencia`,
};

export function getCalBookingLink(serviceType: string): string | null {
  const serviceLower = serviceType.toLowerCase();

  // Buscar coincidencia exacta
  if (CAL_BOOKING_LINKS[serviceLower]) {
    return CAL_BOOKING_LINKS[serviceLower];
  }

  // Buscar coincidencia parcial
  for (const [key, value] of Object.entries(CAL_BOOKING_LINKS)) {
    if (serviceLower.includes(key) || key.includes(serviceLower)) {
      return value;
    }
  }

  return null;
}

export function getServiceNameFromLink(link: string): string {
  for (const [service, serviceLink] of Object.entries(CAL_BOOKING_LINKS)) {
    if (serviceLink === link) {
      return service;
    }
  }
  return 'consulta';
}
