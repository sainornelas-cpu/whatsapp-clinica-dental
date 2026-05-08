// Script para verificar los UIDs de citas en Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zzaetaljaxxuvbgnfdvc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6YWV0YWxqYXh4dXZiZ25mZHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjEwMjY3MSwiZXhwIjoyMDkxNjc4NjcxfQ.az20amY0aK5mNQAa5kuACGJ7QXd1TFc64S72jWJCvEA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAppointments() {
  console.log('=== VERIFICANDO CITAS EN SUPABASE ===\n');

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*')
    .in('status', ['scheduled', 'pending'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Encontradas ${appointments.length} citas:\n`);

  appointments.forEach((apt, i) => {
    console.log(`Cita ${i + 1}:`);
    console.log(`  ID: ${apt.id}`);
    console.log(`  Teléfono: ${apt.phone_number}`);
    console.log(`  Servicio: ${apt.service_type}`);
    console.log(`  Status: ${apt.status}`);
    console.log(`  Cal Booking UID: ${apt.cal_booking_uid}`);
    console.log(`  Fecha: ${apt.appointment_date}`);
    console.log(`  Creada: ${apt.created_at}`);
    console.log('');

    // Generar el link de gestión
    if (apt.cal_booking_uid) {
      const uid = apt.cal_booking_uid.replace('booking_', '');
      const managementLink = `https://app.cal.com/reschedule/${uid}`;
      console.log(`  Link de gestión: ${managementLink}`);
      console.log('');
    }
  });
}

checkAppointments().catch(console.error);
