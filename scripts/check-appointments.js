// Script para verificar citas en Supabase
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

async function checkAppointments() {
  console.log('📅 Verificando citas en Supabase...\n');

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/appointments?select=*&order=created_at.desc&limit=10`, {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (response.ok) {
      const appointments = await response.json();

      console.log(`📊 Citas encontradas: ${appointments.length}\n`);

      if (appointments.length === 0) {
        console.log('⚠️  No hay citas registradas aún.');
        console.log('   Esto significa que la función book_appointment no está funcionando correctamente.\n');
      } else {
        for (const apt of appointments) {
          console.log(`📱 Teléfono: ${apt.phone_number}`);
          console.log(`   Servicio: ${apt.service_type}`);
          console.log(`   Fecha: ${new Date(apt.appointment_date).toLocaleString('es-MX', { timeZone: 'America/Tijuana' })}`);
          console.log(`   Estado: ${apt.status}`);
          console.log(`   Cal Booking UID: ${apt.cal_booking_uid || 'N/A'}`);
          console.log(`   Notas: ${apt.notes || 'N/A'}`);
          console.log('');
        }
      }
    } else {
      console.log('❌ Error obteniendo citas:', await response.text());
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkAppointments();
