// Script para verificar el usuario en Supabase
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

async function checkUser() {
  const userId = 'd71086f1-52ec-4b16-8915-be1f0aa052c7';

  console.log('🔍 Verificando usuario en Supabase...\n');
  console.log(`User ID: ${userId}\n`);

  // Usar Service Role Key para acceder a la tabla de usuarios
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'GET',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const userData = await response.json();
      console.log('✅ Usuario encontrado en auth.users:\n');
      console.log('   Email:', userData.email || 'No disponible');
      console.log('   Creado:', new Date(userData.created_at).toLocaleString());
      console.log('   Confirmado:', userData.email_confirmed_at ? 'Sí' : 'No');
      console.log('   Último login:', userData.last_sign_in_at ? new Date(userData.last_sign_in_at).toLocaleString() : 'Nunca');

      if (!userData.email_confirmed_at) {
        console.log('\n⚠️  El usuario no ha confirmado su email.');
        console.log('   Puedes confirmarlo manualmente desde el dashboard de Supabase.');
      }

      console.log('\n✅ El usuario está listo para usar.');
      console.log('\n🔑 Datos para iniciar sesión:');
      console.log('   Email:', userData.email || '(necesitas verificar en el dashboard)');
      console.log('   URL de login: https://whatsapp-clinica-dental.vercel.app/login');
    } else {
      const error = await response.text();
      console.log('❌ Usuario no encontrado en auth.users');
      console.log('   Error:', error);
      console.log('\n💡 El usuario puede existir solo en la tabla patients.');
      console.log('   Necesitas crear el usuario en autenticación para poder hacer login.');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkUser();
