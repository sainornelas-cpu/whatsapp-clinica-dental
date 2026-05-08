// Test script para encontrar el formato correcto del link de gestión de Cal.com

const CAL_BASE_URL = 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr';

// Ejemplo de booking_uid que se genera en el sistema
const exampleBookingUid = 'booking_12345678-1234-1234-1234-123456789012';

// Posibles formatos de link de gestión de cita en Cal.com
const possibleFormats = [
  `${CAL_BASE_URL}/reschedule/${exampleBookingUid}`,
  `${CAL_BASE_URL}/booking/${exampleBookingUid}`,
  `${CAL_BASE_URL}/cancel/${exampleBookingUid}`,
  `${CAL_BASE_URL}?reschedule=${exampleBookingUid}`,
  `${CAL_BASE_URL}/manage/${exampleBookingUid}`,
  `https://cal.com/booking/${exampleBookingUid}`,
  `https://cal.com/reschedule/${exampleBookingUid}`,
];

console.log('Posibles formatos de link de gestión de cita en Cal.com:\n');
possibleFormats.forEach((format, index) => {
  console.log(`${index + 1}. ${format}`);
});

console.log('\n\nNOTA: En Cal.com, cuando alguien agenda una cita, recibe un email con:');
console.log('- Link para ver detalles de la cita');
console.log('- Botón para cancelar');
console.log('- Botón para reagendar');
console.log('\nEstos links probablemente siguen uno de los formatos anteriores.');
console.log('\nSegún la documentación de Cal.com, el formato para gestionar una cita es:');
console.log('https://cal.com/reschedule/[booking-uid]');
