// Test para verificar el formato del link de booking con teléfono

const CAL_USER = 'alfredo-sain-ornelas-almeida-e6i0wr';
const CAL_DOMAIN = 'https://app.cal.com';

const CAL_BOOKING_LINKS = {
  'limpieza': `${CAL_DOMAIN}/${CAL_USER}/limpieza-dental-profesional`,
  'consulta': `${CAL_DOMAIN}/${CAL_USER}/consulta-general`,
  'blanqueamiento': `${CAL_DOMAIN}/${CAL_USER}/blanqueamiento-dental`,
};

function getBookingLinkWithPhone(serviceType, phone) {
  const link = CAL_BOOKING_LINKS[serviceType.toLowerCase()];
  if (!link) return null;
  return `${link}?phoneNumber=${phone}`;
}

console.log('=== TEST DE LINKS DE BOOKING CON TELÉFONO ===\n');

const testCases = [
  { service: 'limpieza', phone: '5216651108583' },
  { service: 'consulta', phone: '5216641234567' },
  { service: 'blanqueamiento', phone: '5216559876543' },
];

testCases.forEach((test, i) => {
  console.log(`Test ${i + 1}:`);
  console.log(`  Servicio: ${test.service}`);
  console.log(`  Teléfono: ${test.phone}`);
  const link = getBookingLinkWithPhone(test.service, test.phone);
  console.log(`  Link: ${link}`);
  console.log('');
});

console.log('=== FORMATO ESPERADO ===');
console.log('https://app.cal.com/[username]/[event-slug]?phoneNumber=[phone]');
console.log('');
console.log('Para probar manualmente, abre uno de los links generados arriba en tu navegador.');
