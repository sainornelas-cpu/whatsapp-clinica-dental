// Script para probar la API de bookings de Cal.com con formato correcto
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');

  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  return env;
}

const env = loadEnvFile();

async function testCalBooking() {
  console.log('📅 Probando API de bookings de Cal.com con formato correcto...\n');

  // API v2 con parámetros correctos
  console.log('Probando API v2 con todos los campos requeridos...');
  try {
    // Obtener un slot disponible primero
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const slotsResponse = await fetch(`https://api.cal.com/v1/slots?apiKey=${env.CAL_API_KEY}&eventTypeId=${env.CAL_EVENT_TYPE_CONSULTA}&startTime=${tomorrowDate}T00:00:00Z&endTime=${tomorrowDate}T23:59:59Z`);
    const slotsData = await slotsResponse.json();

    if (!slotsResponse.ok || !slotsData.slots || slotsData.slots.length === 0) {
      console.log('⚠️  No hay slots disponibles para hoy, probando con fecha futura...');
    }

    // Usar una fecha futura garantizada
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const startTime = new Date(futureDate);
    startTime.setHours(10, 0, 0, 0); // 10 AM

    const response = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventTypeId: parseInt(env.CAL_EVENT_TYPE_CONSULTA),
        start: startTime.toISOString(),
        name: 'Test Usuario',
        email: 'test@example.com',
        smsReminderNumber: '+521234567890',
        notes: 'Test booking desde script',
        timeZone: 'America/Tijuana',
        language: 'es',
        metadata: {},
      }),
    });

    console.log('   Status:', response.status);
    const data = await response.json();

    if (response.ok) {
      console.log('   ✅ ¡Booking exitoso!');
      console.log('   Booking ID:', data.uid || data.id);
      console.log('   Detalles:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      console.log('   ❌ Error:', JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

testCalBooking();
