// Script para verificar que las tablas de Supabase se crearon correctamente
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

async function verifyTables() {
  console.log('🗄️  Verificando tablas de Supabase...\n');

  const tables = ['patients', 'appointments', 'conversations', 'messages'];
  const results = {};

  for (const table of tables) {
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=count&limit=0`, {
        headers: {
          'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Prefer': 'count=exact',
        },
      });

      if (response.ok) {
        results[table] = '✅ Creada';
        console.log(`  ✅ Tabla "${table}" existe`);
      } else {
        results[table] = `❌ Error ${response.status}`;
        console.log(`  ❌ Tabla "${table}": ${await response.text()}`);
      }
    } catch (error) {
      results[table] = `❌ ${error.message}`;
      console.log(`  ❌ Tabla "${table}": ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  const allCreated = Object.values(results).every(r => r === '✅ Creada');

  if (allCreated) {
    console.log('\n🎉 ¡Todas las tablas se crearon correctamente!');
    console.log('   Tu proyecto está completamente configurado.\n');
  } else {
    console.log('\n⚠️  Algunas tablas fallaron. Revisa los errores arriba.\n');
  }

  return allCreated;
}

verifyTables();
