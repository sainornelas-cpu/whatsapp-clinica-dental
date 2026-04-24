// Script para probar diferentes formatos de la API v2 de Cal.com
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

const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
const startTime = new Date(futureDate);
startTime.setHours(10, 0, 0, 0); // 10 AM

const testCases = [
  {
    name: 'Variación 1: Con todos los campos',
    body: {
      eventTypeId: parseInt(env.CAL_EVENT_TYPE_CONSULTA),
      start: startTime.toISOString(),
      name: 'Test Usuario',
      email: 'test@example.com',
      smsReminderNumber: '+521234567890',
      notes: 'Test booking',
      timeZone: 'America/Tijuana',
      language: 'es',
      metadata: {},
    },
  },
  {
    name: 'Variación 2: Sin metadata',
    body: {
      eventTypeId: parseInt(env.CAL_EVENT_TYPE_CONSULTA),
      start: startTime.toISOString(),
      name: 'Test Usuario',
      email: 'test@example.com',
      smsReminderNumber: '+521234567890',
      notes: 'Test booking',
      timeZone: 'America/Tijuana',
      language: 'es',
    },
  },
  {
    name: 'Variación 3: Con attendees array',
    body: {
      eventTypeId: parseInt(env.CAL_EVENT_TYPE_CONSULTA),
      start: startTime.toISOString(),
      attendees: [{
        name: 'Test Usuario',
        email: 'test@example.com',
        timeZone: 'America/Tijuana',
      }],
      language: 'es',
      metadata: {},
    },
  },
  {
    name: 'Variación 4: Formato simplificado',
    body: {
      eventTypeId: parseInt(env.CAL_EVENT_TYPE_CONSULTA),
      start: startTime.toISOString(),
      title: 'Consulta con Test Usuario',
      description: 'Test booking',
      location: 'Clínica Dental Sonrisa',
    },
  },
];

async function testVariation(testCase) {
  console.log(`\n📋 ${testCase.name}`);
  console.log('   Body:', JSON.stringify(testCase.body, null, 2));

  try {
    const response = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.body),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`   ✅ ¡Éxito!`);
      console.log(`   Booking ID:`, data.uid || data.id);
      return { success: true, data };
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   Error:`, JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Probando diferentes formatos para la API v2 de Cal.com...\n');

  for (const testCase of testCases) {
    await testVariation(testCase);

    // Esperar un poco entre pruebas
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(80));
}

runTests();
