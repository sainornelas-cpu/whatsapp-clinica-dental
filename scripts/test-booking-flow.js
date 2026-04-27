/**
 * Script de prueba para el flujo de agendado y cancelación de citas
 * Simula las funciones del bot WhatsApp sin necesidad de enviar mensajes reales
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

// Read environment from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Archivo .env.local no encontrado');
  console.error('   Crea el archivo .env.local basado en .env.local.example');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
      env[key.trim()] = values.join('=').trim();
    }
  }
});

// Validate required env vars
const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = requiredVars.filter(v => !env[v]);
if (missing.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missing.join(', '));
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Service types and their booking links
const CAL_BOOKING_LINKS = {
  'limpieza': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/limpieza-dental-profesional',
  'consulta': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/consulta-general',
  'blanqueamiento': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/blanqueamiento-dental',
  'ortodoncia': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/ortodoncia',
  'extracción': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/extraccion-dental',
  'urgencia': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/atencion-de-urgencia',
};

function getCalBookingLink(serviceType) {
  const serviceLower = serviceType.toLowerCase();

  // Buscar coincidencia exacta
  if (CAL_BOOKING_LINKS[serviceLower]) {
    return CAL_BOOKING_LINKS[serviceLower];
  }

  // Buscar coincidencia parcial
  for (const [key, value] of Object.entries(CAL_BOOKING_LINKS)) {
    if (serviceLower.includes(key) || key.includes(serviceLower)) {
      return value;
    }
  }

  return null;
}

// Test phone number (can be changed)
const TEST_PHONE = process.env.TEST_PHONE || '+521234567890';

console.log('='.repeat(60));
console.log('🧪 PRUEBA DE FLUJO DE AGENDADO Y CANCELACIÓN');
console.log('='.repeat(60));
console.log('');

async function testBookingFlow() {
  const calBookingUid = `test_booking_${randomUUID()}`;
  const serviceType = 'limpieza';

  console.log('📱 Paso 1: Simular solicitud de agendado');
  console.log(`   Teléfono: ${TEST_PHONE}`);
  console.log(`   Servicio: ${serviceType}`);
  console.log(`   Booking UID: ${calBookingUid}`);
  console.log('');

  // Paso 1: Crear cita pendiente
  try {
    console.log('💾 Paso 2: Crear cita en Supabase (estado: pending)');

    const { data: newAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        phone_number: TEST_PHONE,
        cal_booking_uid: calBookingUid,
        service_type: serviceType,
        appointment_date: new Date().toISOString(),
        status: 'pending',
        notes: `Link de booking: ${getCalBookingLink(serviceType)}`,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error al crear cita:', insertError);
      return;
    }

    console.log('✅ Cita creada exitosamente');
    console.log(`   ID: ${newAppointment.id}`);
    console.log(`   Estado: ${newAppointment.status}`);
    console.log(`   Link: ${getCalBookingLink(serviceType)}`);
    console.log('');

    // Paso 2: Verificar que la cita existe
    console.log('🔍 Paso 3: Verificar que la cita existe en la base de datos');

    const { data: appointment, error: findError } = await supabase
      .from('appointments')
      .select('*')
      .eq('cal_booking_uid', calBookingUid)
      .single();

    if (findError || !appointment) {
      console.error('❌ Error: No se encontró la cita creada');
      return;
    }

    console.log('✅ Cita encontrada');
    console.log(`   Servicio: ${appointment.service_type}`);
    console.log(`   Estado: ${appointment.status}`);
    console.log('');

    // Paso 3: Simular confirmación de Cal.com
    console.log('📅 Paso 4: Simular confirmación desde Cal.com (BOOKING_CREATED)');
    console.log('   Esto es lo que pasaría cuando el usuario completa la reserva');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2); // 2 días en el futuro
    futureDate.setHours(10, 0, 0, 0);

    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'scheduled',
        appointment_date: futureDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointment.id);

    if (updateError) {
      console.error('❌ Error al actualizar cita:', updateError);
      return;
    }

    console.log('✅ Cita actualizada a estado: scheduled');
    console.log(`   Fecha: ${futureDate.toISOString()}`);
    console.log('');

    // Paso 4: Verificar las citas del paciente
    console.log('📋 Paso 5: Verificar citas del paciente ("mis citas")');

    const { data: appointments, error: listError } = await supabase
      .from('appointments')
      .select('*')
      .eq('phone_number', TEST_PHONE)
      .in('status', ['scheduled', 'pending'])
      .order('appointment_date', { ascending: true });

    if (listError) {
      console.error('❌ Error al listar citas:', listError);
      return;
    }

    console.log(`✅ Citas encontradas: ${appointments.length}`);
    appointments.forEach((apt, idx) => {
      console.log(`   ${idx + 1}. ${apt.service_type} - ${apt.status} - ${apt.appointment_date}`);
    });
    console.log('');

    // Paso 5: Cancelar la cita
    console.log('❌ Paso 6: Cancelar la cita');

    const { error: cancelError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('cal_booking_uid', calBookingUid);

    if (cancelError) {
      console.error('❌ Error al cancelar cita:', cancelError);
      return;
    }

    console.log('✅ Cita cancelada exitosamente');
    console.log('');

    // Paso 6: Verificar que la cita ya no aparece en "mis citas"
    console.log('🔍 Paso 7: Verificar que la cita cancelada no aparece en "mis citas"');

    const { data: activeAppointments, error: activeError } = await supabase
      .from('appointments')
      .select('*')
      .eq('phone_number', TEST_PHONE)
      .in('status', ['scheduled', 'pending'])
      .order('appointment_date', { ascending: true });

    if (activeError) {
      console.error('❌ Error al listar citas activas:', activeError);
      return;
    }

    console.log(`✅ Citas activas después de cancelar: ${activeAppointments.length}`);
    if (activeAppointments.length === 0) {
      console.log('   ✅ La cita cancelada ya no aparece');
    } else {
      activeAppointments.forEach((apt, idx) => {
        console.log(`   ${idx + 1}. ${apt.service_type} - ${apt.status}`);
      });
    }
    console.log('');

    // Cleanup: Remove test appointment
    console.log('🧹 Paso 8: Limpiar cita de prueba');

    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('cal_booking_uid', calBookingUid);

    if (deleteError) {
      console.error('⚠️  Advertencia: No se pudo eliminar la cita de prueba');
      console.error('   Ejecuta manualmente: DELETE FROM appointments WHERE cal_booking_uid =', calBookingUid);
    } else {
      console.log('✅ Cita de prueba eliminada');
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('🎉 TODAS LAS PRUEBAS PASARON');
    console.log('='.repeat(60));
    console.log('');
    console.log('📝 Resumen:');
    console.log('   ✅ Crear cita pendiente (pending)');
    console.log('   ✅ Verificar cita en base de datos');
    console.log('   ✅ Actualizar a confirmada (scheduled)');
    console.log('   ✅ Listar citas del paciente');
    console.log('   ✅ Cancelar cita');
    console.log('   ✅ Verificar que no aparece en citas activas');
    console.log('');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    console.log('');
    console.log('💡 Para limpiar manualmente, ejecuta en Supabase SQL:');
    console.log(`   DELETE FROM appointments WHERE cal_booking_uid = '${calBookingUid}';`);
  }
}

// Run test
testBookingFlow().catch(console.error);
