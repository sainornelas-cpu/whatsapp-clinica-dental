// Script de prueba para el webhook del bot
// Simula todo el proceso de booking para detectar errores

// Test 1: Probar generación de links de Cal.com
console.log('=== TEST 1: Probar getCalBookingLink() ===\n');

const CAL_BOOKING_LINKS = {
  'limpieza dental': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/limpieza-dental-profesional',
  'limpieza': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/limpieza-dental-profesional',
  'consulta general': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/consulta-general',
  'consulta': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/consulta-general',
  'revisión': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/consulta-general',
  'blanqueamiento dental': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/blanqueamiento-dental',
  'blanqueamiento': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/blanqueamiento-dental',
  'ortodoncia': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/ortodoncia',
  'extracción dental': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/extraccion-dental',
  'extracción': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/extraccion-dental',
  'atención de urgencia': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/atencion-de-urgencia',
  'urgencia': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/atencion-de-urgencia',
  'urgencia dental': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/atencion-de-urgencia',
};

function getCalBookingLink(serviceType) {
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

const services = [
  'limpieza dental',
  'limpieza',
  'consulta general',
  'consulta',
  'blanqueamiento dental',
  'blanqueamiento',
  'ortodoncia',
  'extracción dental',
  'extracción',
  'urgencia'
];

let linkTestPassed = true;
for (const service of services) {
  const link = getCalBookingLink(service);
  if (!link) {
    console.log(`❌ FAIL: "${service}" - Link es null`);
    linkTestPassed = false;
  } else {
    console.log(`✅ PASS: "${service}" -> ${link}`);
  }
}

console.log('\n=== RESUMEN ===');
console.log(`TEST 1 (Links Cal.com): ${linkTestPassed ? '✅ PASS' : '❌ FAIL'}`);
console.log('\nRevisa los logs anteriores para detalles de cada test.');
