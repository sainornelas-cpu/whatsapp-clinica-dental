// Script para probar endpoints alternativos de Cal.com
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

async function testAlternativeEndpoints() {
  console.log('🧪 Probando endpoints alternativos de Cal.com...\n');

  const testCases = [
    {
      name: 'API v1 con slug de usuario',
      url: `https://api.cal.com/v1/bookings?apiKey=${env.CAL_API_KEY}`,
      body: {
        slug: 'alfredo-sain-ornelas-almeida-e6i0wr/consulta-general',
        start: startTime.toISOString(),
        name: 'Test Usuario',
        email: 'test@example.com',
        smsReminderNumber: '+521234567890',
        notes: 'Test booking con slug',
      },
    },
    {
      name: 'API v1 con eventTypeId',
      url: `https://api.cal.com/v1/bookings?apiKey=${env.CAL_API_KEY}`,
      body: {
        eventTypeId: parseInt(env.CAL_EVENT_TYPE_CONSULTA),
        start: startTime.toISOString(),
        name: 'Test Usuario',
        email: 'test@example.com',
        smsReminderNumber: '+521234567890',
        notes: 'Test booking con eventTypeId',
      },
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    console.log(`   Body:`, JSON.stringify(testCase.body, null, 2));

    try {
      const response = await fetch(testCase.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.body),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`   ✅ ¡Éxito!`);
        console.log(`   Booking:`, JSON.stringify(data, null, 2));
        return { success: true, data };
      } else {
        console.log(`   ❌ Status: ${response.status}`);
        console.log(`   Error:`, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.log(`   ❌ Error:`, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { success: false };
}

testAlternativeEndpoints();
