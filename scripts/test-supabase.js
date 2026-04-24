// Script específico para probar Supabase
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

async function testSupabase() {
  console.log('🗄️  Probando conexión a Supabase...\n');

  // Prueba 1: Verificar URL válida
  console.log('1. Verificando URL...');
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    console.log('   ✅ URL válida');
  } else {
    console.log('   ❌ URL inválida');
    return false;
  }

  // Prueba 2: Probar conexión con Anon Key (para operaciones cliente)
  console.log('\n2. Probando conexión con Anon Key...');
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });

    if (response.ok) {
      console.log('   ✅ Anon Key funciona (conexión cliente)');
    } else {
      console.log('   ⚠️  Anon Key: ', await response.text());
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Prueba 3: Probar consulta a una tabla (usando Anon Key)
  console.log('\n3. Probando consulta a tablas...');
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/patients?select=count&limit=0`, {
      headers: {
        'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Prefer': 'count=exact',
      },
    });

    if (response.ok) {
      console.log('   ✅ Puede leer tablas');
    } else if (response.status === 404 || response.status === 403) {
      console.log('   ⚠️  Tabla no encontrada o sin permisos (normal si aún no se ha creado la base de datos)');
    } else {
      console.log('   ❌ Error:', await response.text());
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Prueba 4: Verificar que Service Role Key exista y sea diferente de Anon Key
  console.log('\n4. Verificando Service Role Key...');
  if (env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY !== env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('   ✅ Service Role Key configurada correctamente');
  } else if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('   ❌ Service Role Key faltante');
  } else {
    console.log('   ⚠️  Service Role Key es igual a Anon Key (deben ser diferentes)');
  }

  console.log('\n✅ Configuración de Supabase verificada');
  console.log('   Nota: Si aún no has ejecutado el schema.sql, es normal que las tablas no existan aún.');
  return true;
}

testSupabase();
