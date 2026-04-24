// Script para probar todas las configuraciones
// Ejecutar con: node scripts/test-config.js

const fs = require('fs');
const path = require('path');

// Leer archivo .env.local manualmente
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

console.log('🔍 Probando configuraciones...\n');

// 1. Verificar que todas las variables estén presentes
console.log('📋 Verificando variables de entorno...');
const requiredVars = {
  'WHATSAPP_ACCESS_TOKEN': env.WHATSAPP_ACCESS_TOKEN,
  'WHATSAPP_PHONE_NUMBER_ID': env.WHATSAPP_PHONE_NUMBER_ID,
  'WHATSAPP_VERIFY_TOKEN': env.WHATSAPP_VERIFY_TOKEN,
  'OPENAI_API_KEY': env.OPENAI_API_KEY,
  'NEXT_PUBLIC_SUPABASE_URL': env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': env.SUPABASE_SERVICE_ROLE_KEY,
  'CAL_API_KEY': env.CAL_API_KEY,
  'CAL_EVENT_TYPE_LIMPIEZA': env.CAL_EVENT_TYPE_LIMPIEZA,
  'CAL_EVENT_TYPE_CONSULTA': env.CAL_EVENT_TYPE_CONSULTA,
  'CAL_EVENT_TYPE_BLANQUEAMIENTO': env.CAL_EVENT_TYPE_BLANQUEAMIENTO,
  'CAL_EVENT_TYPE_ORTODONCIA': env.CAL_EVENT_TYPE_ORTODONCIA,
  'CAL_EVENT_TYPE_EXTRACCION': env.CAL_EVENT_TYPE_EXTRACCION,
  'CAL_EVENT_TYPE_URGENCIA': env.CAL_EVENT_TYPE_URGENCIA,
  'CRON_SECRET': env.CRON_SECRET,
};

let allPresent = true;
for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    console.log(`  ✅ ${key}: ${value.substring(0, 15)}${value.length > 15 ? '...' : ''}`);
  } else {
    console.log(`  ❌ ${key}: FALTANTE`);
    allPresent = false;
  }
}

console.log('\n' + '='.repeat(80) + '\n');

// 2. Probar conexión a Supabase
async function testSupabase() {
  console.log('🗄️  Probando conexión a Supabase...');
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });

    if (response.ok) {
      console.log('  ✅ Conexión a Supabase exitosa');
      return true;
    } else {
      console.log('  ❌ Error conectando a Supabase:', await response.text());
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error conectando a Supabase:', error.message);
    return false;
  }
}

// 3. Probar conexión a OpenAI
async function testOpenAI() {
  console.log('🤖 Probando conexión a OpenAI...');
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
    });

    if (response.ok) {
      console.log('  ✅ Conexión a OpenAI exitosa');
      return true;
    } else {
      console.log('  ❌ Error conectando a OpenAI:', await response.text());
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error conectando a OpenAI:', error.message);
    return false;
  }
}

// 4. Probar conexión a Cal.com
async function testCalCom() {
  console.log('📅 Probando conexión a Cal.com...');
  try {
    const response = await fetch('https://api.cal.com/v2/event-types', {
      headers: {
        'Authorization': `Bearer ${env.CAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('  ✅ Conexión a Cal.com exitosa');
      return true;
    } else {
      console.log('  ❌ Error conectando a Cal.com:', await response.text());
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error conectando a Cal.com:', error.message);
    return false;
  }
}

// 5. Probar conexión a WhatsApp
async function testWhatsApp() {
  console.log('📱 Probando configuración de WhatsApp...');
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_NUMBER_ID}`, {
      headers: {
        'Authorization': `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      },
    });

    if (response.ok) {
      console.log('  ✅ Conexión a WhatsApp API exitosa');
      return true;
    } else {
      console.log('  ❌ Error conectando a WhatsApp:', await response.text());
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error conectando a WhatsApp:', error.message);
    return false;
  }
}

// Ejecutar todas las pruebas
async function runTests() {
  if (!allPresent) {
    console.log('\n❌ Faltan variables de entorno. Por favor completa el archivo .env.local');
    return;
  }

  const results = {
    supabase: await testSupabase(),
    openai: await testOpenAI(),
    calcom: await testCalCom(),
    whatsapp: await testWhatsApp(),
  };

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Resumen de pruebas:');
  console.log('='.repeat(80));

  for (const [service, success] of Object.entries(results)) {
    const icon = success ? '✅' : '❌';
    console.log(`  ${icon} ${service.toUpperCase()}`);
  }

  const allPassed = Object.values(results).every(r => r);
  if (allPassed) {
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('   Tu proyecto está listo para funcionar.\n');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
    console.log('\n');
  }
}

runTests();
