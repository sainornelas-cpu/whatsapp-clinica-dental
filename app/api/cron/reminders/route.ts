import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

// Send WhatsApp template message
async function sendWhatsAppReminder(phoneNumber: string, patientName: string, appointmentDate: string, serviceType: string) {
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const message = `Hola ${patientName}, este es un recordatorio de tu cita en Clínica Dental Sonrisa.\n\n🦷 Servicio: ${serviceType}\n📅 Fecha: ${new Date(appointmentDate).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'full', timeStyle: 'short' })}\n\nPor favor llega 10 minutos antes de tu cita. Si necesitas cancelar o reagendar, responde a este mensaje.\n\n¡Te esperamos!`;

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
    console.error('Error sending WhatsApp reminder:', error);
    throw new Error('Failed to send WhatsApp reminder');
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  console.log('Cron job: Sending appointment reminders');

  // Verify cron secret
  if (!verifyCronSecret(request)) {
    console.error('Unauthorized cron job attempt');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get appointments between now+20h and now+28h that haven't been reminded
    const now = new Date();
    const startWindow = new Date(now.getTime() + 20 * 60 * 60 * 1000);
    const endWindow = new Date(now.getTime() + 28 * 60 * 60 * 1000);

    console.log(`Searching for appointments between ${startWindow.toISOString()} and ${endWindow.toISOString()}`);

    const { data: appointments, error } = await supabaseService
      .from('appointments')
      .select('*, patients!inner(*)')
      .eq('status', 'scheduled')
      .eq('reminder_sent', false)
      .gte('appointment_date', startWindow.toISOString())
      .lte('appointment_date', endWindow.toISOString());

    if (error) {
      console.error('Error fetching appointments:', error);
      return new NextResponse('Error fetching appointments', { status: 500 });
    }

    console.log(`Found ${appointments?.length || 0} appointments to remind`);

    if (!appointments || appointments.length === 0) {
      return new NextResponse('No reminders to send', { status: 200 });
    }

    let successCount = 0;
    let failureCount = 0;

    for (const appointment of appointments) {
      try {
        await sendWhatsAppReminder(
          appointment.phone_number,
          appointment.patients.full_name || 'Paciente',
          appointment.appointment_date,
          appointment.service_type
        );

        // Mark reminder as sent
        const { error: updateError } = await supabaseService
          .from('appointments')
          .update({ reminder_sent: true, updated_at: new Date().toISOString() })
          .eq('id', appointment.id);

        if (updateError) {
          console.error('Error updating appointment reminder status:', updateError);
        }

        successCount++;
        console.log(`Reminder sent for appointment ${appointment.id}`);
      } catch (error) {
        console.error(`Failed to send reminder for appointment ${appointment.id}:`, error);
        failureCount++;
      }
    }

    console.log(`Cron job completed: ${successCount} reminders sent, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Reminders sent: ${successCount}, Failed: ${failureCount}`,
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}