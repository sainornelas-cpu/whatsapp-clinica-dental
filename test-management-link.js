// Test para verificar que getCalManagementLink genera el link correcto
// Formato correcto: https://app.cal.com/reschedule/{uid}
// Source: https://github.com/calcom/cal.com/issues/28829

function getCalManagementLink(bookingUid, serviceType) {
  if (!bookingUid) return null;

  // Remove the "booking_" prefix if it exists
  const uid = bookingUid.replace('booking_', '');

  // Cal.com management link format: /reschedule/{uid}
  return `https://app.cal.com/reschedule/${uid}`;
}

// Test cases
console.log('=== TEST DE GENERACIÓN DE LINKS DE GESTIÓN ===\n');
console.log('Fuente: GitHub Issue #28829\n');

const testCases = [
  { uid: 'booking_123abc-456def', service: 'limpieza' },
  { uid: 'booking_789xyz', service: 'consulta' },
  { uid: 'booking_456def', service: 'blanqueamiento' },
  { uid: 'abc-123', service: 'ortodoncia' }, // sin prefix
  { uid: '', service: 'urgencia' }, // uid vacío
];

testCases.forEach((test, i) => {
  console.log(`Test ${i + 1}:`);
  console.log(`  UID: ${test.uid || '(vacío)'}`);
  const link = getCalManagementLink(test.uid, test.service);
  console.log(`  Link: ${link || 'null (UID vacío)'}`);
  console.log('');
});

console.log('=== FORMATO CORRECTO ===');
console.log('https://app.cal.com/reschedule/{uid}');
console.log('');
console.log('NOTA: Este link permite tanto REAGENDAR como CANCELAR la reserva.');
console.log('');
console.log('Para probar manualmente, abre uno de los links generados arriba en tu navegador.');

