// Script para probar API v1 de bookings de Cal.com (aunque está "deprecada" puede aún funcionar)
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

async function testCalBookingV1() {
  console.log('📅 Probando API v1 de bookings de Cal.com...\n');

  // Primero obtener un slot disponible
  const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const startTime = new Date(futureDate);
  startTime.setHours(10, 0, 0, 0); // 10 AM

  console.log('Probando con API v1 (bookings endpoint)...');
  try {
    const response = await fetch(`https://api.cal.com/v1/bookings?apiKey=${env.CAL_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventTypeId: parseInt(env.CAL_EVENT_TYPE_CONSULTA),
        start: startTime.toISOString(),
        name: 'Test Usuario',
        email: 'test@example.com',
        smsReminderNumber: '+521234567890',
        notes: 'Test booking v1',
      }),
    });

    console.log('   Status:', response.status);
    const data = await response.json();

    if (response.ok) {
      console.log('   ✅ ¡Booking exitoso con API v1!');
      console.log('   Booking:', JSON.stringify(data, null, 2));
      return { success: true, api: 'v1', data };
    } else {
      console.log('   ❌ Error API v1:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  return { success: false };
}

testCalBookingV1();
