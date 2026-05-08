// Test para verificar la API de Cal.com
const CAL_API_KEY = 'cal_live_2c489b896dac04235041326d05cbf74b';

async function testCalAPI() {
  console.log('=== TEST DE API DE CAL.COM ===\n');

  // Test 1: Crear un booking (SIN duration - ese campo no es aceptado)
  console.log('Test 1: Crear booking con API de Cal.com (sin duration)\n');

  const bookingData = {
    eventTypeId: 5472667, // Limpieza dental
    start: new Date(Date.UTC(2026, 5, 10, 10, 0)).toISOString(), // 10 de JUNIO 2026, 10:00 AM UTC
    attendee: {
      name: 'Test Patient',
      email: 'test@wa-temp.com',
      timeZone: 'America/Mexico_City',
      phoneNumber: '5216651108583',
    },
    // NOTA: NO incluir duration - la API la rechaza
  };

  console.log('Request data:', JSON.stringify(bookingData, null, 2));

  try {
    const response = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
      },
      body: JSON.stringify(bookingData),
    });

    console.log('Response status:', response.status);

    const responseText = await response.text();
    console.log('Response:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('\n✅ Booking creado exitosamente!');
      console.log('Booking UID:', data.data?.uid || data.data?.booking?.uid);
      console.log('Booking ID:', data.data?.id || data.data?.booking?.id);
    } else {
      console.log('\n❌ Error al crear booking');
      console.log('Status:', response.status);
      console.log('Response:', responseText);
    }
  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message);
  }
}

testCalAPI().catch(console.error);
