// Script para probar diferentes endpoints de la API v2
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

async function testEndpoint(name, url, body) {
  console.log(`\n📋 ${name}`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`   ✅ ¡Éxito!`);
      console.log(`   Resultado:`, JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   Error:`, JSON.stringify(data, null, 2).substring(0, 500));
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: false };
}

async function runTests() {
  console.log('🧪 Probando diferentes endpoints de la API v2...\n');

  // Prueba 1: Con attendees (formato común en APIs modernas)
  await testEndpoint(
    'Prueba 1: Con attendees',
    'https://api.cal.com/v2/bookings',
    {
      eventTypeId: parseInt(env.CAL_EVENT_TYPE_CONSULTA),
      start: startTime.toISOString(),
      attendees: [{
        email: 'test@example.com',
        name: 'Test Usuario',
        timeZone: 'America/Tijuana',
      }],
      metadata: {},
      language: 'es',
    }
  );

  // Prueba 2: Sin attendees, con campos directos
  await testEndpoint(
    'Prueba 2: Con campos directos',
    'https://api.cal.com/v2/bookings',
    {
      eventTypeId: parseInt(env.CAL_EVENT_TYPE_CONSULTA),
      start: startTime.toISOString(),
      title: 'Test Booking',
      description: 'Prueba de booking',
      timeZone: 'America/Tijuana',
      language: 'es',
      metadata: {},
      responses: [{
        name: 'Test Usuario',
        email: 'test@example.com',
      }],
    }
  );

  // Prueba 3: Con responses en lugar de attendees
  await testEndpoint(
    'Prueba 3: Con responses',
    'https://api.cal.com/v2/bookings',
    {
      eventTypeId: parseInt(env.CAL_EVENT_TYPE_CONSULTA),
      start: startTime.toISOString(),
      responses: [{
        name: 'Test Usuario',
        email: 'test@example.com',
        timeZone: 'America/Tijuana',
      }],
      language: 'es',
      metadata: {},
    }
  );

  console.log('\n' + '='.repeat(80));
}

runTests();
