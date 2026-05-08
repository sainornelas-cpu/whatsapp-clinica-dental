// Generación de links de booking de Cal.com
// En lugar de usar la API problemática de bookings, generamos links para que el usuario complete la reserva
// IMPORTANT: Must use app.cal.com domain, not cal.com

const CAL_USER = 'alfredo-sain-ornelas-almeida-e6i0wr';
const CAL_DOMAIN = 'https://app.cal.com';

export const CAL_BOOKING_LINKS: Record<string, string> = {
  'limpieza dental': `${CAL_DOMAIN}/${CAL_USER}/limpieza-dental-profesional`,
  'limpieza': `${CAL_DOMAIN}/${CAL_USER}/limpieza-dental-profesional`,
  'consulta general': `${CAL_DOMAIN}/${CAL_USER}/consulta-general`,
  'consulta': `${CAL_DOMAIN}/${CAL_USER}/consulta-general`,
  'revisión': `${CAL_DOMAIN}/${CAL_USER}/consulta-general`,
  'blanqueamiento dental': `${CAL_DOMAIN}/${CAL_USER}/blanqueamiento-dental`,
  'blanqueamiento': `${CAL_DOMAIN}/${CAL_USER}/blanqueamiento-dental`,
  'ortodoncia': `${CAL_DOMAIN}/${CAL_USER}/ortodoncia`,
  'extracción dental': `${CAL_DOMAIN}/${CAL_USER}/extraccion-dental`,
  'extracción': `${CAL_DOMAIN}/${CAL_USER}/extraccion-dental`,
  'atención de urgencia': `${CAL_DOMAIN}/${CAL_USER}/atencion-de-urgencia`,
  'urgencia': `${CAL_DOMAIN}/${CAL_USER}/atencion-de-urgencia`,
  'urgencia dental': `${CAL_DOMAIN}/${CAL_USER}/atencion-de-urgencia`,
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
