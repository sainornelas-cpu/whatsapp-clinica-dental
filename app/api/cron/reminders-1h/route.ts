import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

async function sendWhatsAppReminder(phoneNumber: string, patientName: string, appointmentDate: string, serviceType: string) {
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const message = `¡Hola ${patientName}! Tu cita es en 1 hora.\n\n🦷 Servicio: ${serviceType}\n📅 Hora: ${new Date(appointmentDate).toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' })}\n\nPor favor llega puntual. Si no puedes asistir, avísanos inmediatamente.\n\n¡Te esperamos!`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phoneNumber,
      text: { body: message },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Error sending WhatsApp reminder (1h):', error);
    throw new Error('Failed to send WhatsApp reminder (1h)');
  }

  return response.json();
}

// Verificar si ya se envió un recordatorio de un tipo específico para una cita
async function wasReminderSent(appointmentId: string, reminderType: string): Promise<boolean> {
  const { data, error } = await supabaseService
    .from('reminders_log')
    .select('id')
    .eq('appointment_id', appointmentId)
    .eq('reminder_type', reminderType)
    .maybeSingle();

  if (error) {
    console.error('Error checking reminder log:', error);
    return false;
  }

  return !!data;
}

// Registrar que se envió un recordatorio
async function logReminderSent(appointmentId: string, reminderType: string) {
  const { error } = await supabaseService
    .from('reminders_log')
    .insert({
      appointment_id: appointmentId,
      reminder_type: reminderType,
    });

  if (error) {
    console.error('Error logging reminder:', error);
  }
}

export async function GET(request: NextRequest) {
  console.log('Cron job: Sending 1-hour appointment reminders');

  if (!verifyCronSecret(request)) {
    console.error('Unauthorized cron job attempt (1h)');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Buscar citas entre 50-70 minutos en el futuro
    const now = new Date();
    const startWindow = new Date(now.getTime() + 50 * 60 * 1000); // 50 minutos
    const endWindow = new Date(now.getTime() + 70 * 60 * 1000);   // 70 minutos

    console.log(`Searching for 1h reminders between ${startWindow.toISOString()} and ${endWindow.toISOString()}`);

    const { data: appointments, error } = await supabaseService
      .from('appointments')
      .select('*, patients!inner(*)')
      .eq('status', 'scheduled')
      .gte('appointment_date', startWindow.toISOString())
      .lte('appointment_date', endWindow.toISOString());

    if (error) {
      console.error('Error fetching appointments for 1h reminder:', error);
      return new NextResponse('Error fetching appointments', { status: 500 });
    }

    console.log(`Found ${appointments?.length || 0} appointments in the 1h window`);

    if (!appointments || appointments.length === 0) {
      return NextResponse('No 1h reminders to send', { status: 200 });
    }

    let successCount = 0;
    let failureCount = 0;
    let alreadySentCount = 0;

    for (const appointment of appointments) {
      try {
        // Verificar si ya se envió el recordatorio de 1h
        const wasSent = await wasReminderSent(appointment.id, '1h');

        if (wasSent) {
          alreadySentCount++;
          console.log(`1h reminder already sent for appointment ${appointment.id}`);
          continue;
        }

        // Enviar recordatorio
        await sendWhatsAppReminder(
          appointment.phone_number,
          appointment.patients.full_name || 'Paciente',
          appointment.appointment_date,
          appointment.service_type
        );

        // Registrar que se envió el recordatorio
        await logReminderSent(appointment.id, '1h');

        successCount++;
        console.log(`1h reminder sent for appointment ${appointment.id}`);
      } catch (error) {
        console.error(`Failed to send 1h reminder for appointment ${appointment.id}:`, error);
        failureCount++;
      }
    }

    console.log(`1h cron job completed: ${successCount} sent, ${alreadySentCount} already sent, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `1h Reminders: ${successCount} sent, ${alreadySentCount} already sent, ${failureCount} failed`,
    });
  } catch (error) {
    console.error('Error in 1h cron job:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
