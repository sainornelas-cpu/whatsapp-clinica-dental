import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

// Verify that the request comes from Cal.com using API Key
function verifyCalWebhook(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const apiKey = process.env.CAL_API_KEY;

  // Cal.com sends the API key in the Authorization header as "Bearer <API_KEY>"
  return authHeader === `Bearer ${apiKey}`;
}

// Send WhatsApp message
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

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
    console.error('Error sending WhatsApp message:', error);
    throw new Error('Failed to send WhatsApp message');
  }

  return response.json();
}

// Handle BOOKING_CREATED event
async function handleBookingCreated(payload: any) {
  const { data: { booking } } = payload;

  console.log('Handling BOOKING_CREATED:', booking);

  // Extract relevant information from booking
  const bookingUid = booking.uid;
  const startTime = booking.startTime;
  const endTime = booking.endTime;
  const status = booking.status; // 'ACCEPTED', 'CANCELLED', 'REJECTED', etc.
  const attendeeEmail = booking.attendees?.[0]?.email;
  const attendeeName = booking.attendees?.[0]?.name;
  const attendeePhone = booking.attendees?.[0]?.phoneNumber;
  const eventTypeSlug = booking.eventType?.slug;
  const eventTypeId = booking.eventTypeId;

  // Map Cal.com event type slug to our service type
  const serviceTypeMap: { [key: string]: string } = {
    'limpieza-dental-profesional': 'limpieza',
    'consulta-general': 'consulta',
    'blanqueamiento-dental': 'blanqueamiento',
    'ortodoncia': 'ortodoncia',
    'extraccion-dental': 'extracción',
    'atencion-de-urgencia': 'urgencia',
  };

  const serviceType = eventTypeSlug ? serviceTypeMap[eventTypeSlug] : 'consulta';

  // Find appointment by cal_booking_uid
  const { data: appointment, error: findError } = await supabaseService
    .from('appointments')
    .select('*')
    .eq('cal_booking_uid', bookingUid)
    .single();

  if (findError || !appointment) {
    console.log('Appointment not found by UID, trying to find by phone and status pending...');

    // If not found by UID, try to find by phone number and pending status
    if (attendeePhone) {
      const { data: pendingAppointments } = await supabaseService
        .from('appointments')
        .select('*')
        .eq('phone_number', attendeePhone)
        .eq('status', 'pending')
        .eq('service_type', serviceType)
        .order('created_at', { ascending: false })
        .limit(1);

      if (pendingAppointments && pendingAppointments.length > 0) {
        console.log('Found pending appointment, updating...');
        const pendingAppointment = pendingAppointments[0];

        // Update the appointment with confirmed status and booking details
        const { error: updateError } = await supabaseService
          .from('appointments')
          .update({
            status: 'scheduled',
            cal_booking_uid: bookingUid,
            appointment_date: startTime,
            notes: pendingAppointment.notes, // Keep the booking link
            updated_at: new Date().toISOString(),
          })
          .eq('id', pendingAppointment.id);

        if (updateError) {
          console.error('Error updating appointment:', updateError);
          return { error: 'Error updating appointment' };
        }

        // Send confirmation message via WhatsApp
        try {
          const patientName = attendeeName || 'Paciente';
          const message = `¡Tu cita ha sido confirmada! 🦷

${patientName}, tu reserva para ${serviceType} está confirmada.

📅 Fecha y hora: ${new Date(startTime).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'full', timeStyle: 'short' })}

📍 Clínica Dental Sonrisa

Si necesitas cancelar o reagendar, responde a este mensaje o usa el link de tu cita.`;

          await sendWhatsAppMessage(attendeePhone, message);
          console.log('Confirmation message sent to:', attendeePhone);
        } catch (msgError) {
          console.error('Error sending confirmation message:', msgError);
        }

        return { success: true, message: 'Appointment confirmed' };
      }
    }

    return { error: 'Appointment not found' };
  }

  // Update existing appointment
  const { error: updateError } = await supabaseService
    .from('appointments')
    .update({
      status: status === 'ACCEPTED' ? 'scheduled' : status.toLowerCase(),
      appointment_date: startTime,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointment.id);

  if (updateError) {
    console.error('Error updating appointment:', updateError);
    return { error: 'Error updating appointment' };
  }

  // Send confirmation message if status is ACCEPTED
  if (status === 'ACCEPTED' && appointment.phone_number) {
    try {
      const patientName = attendeeName || appointment.patients?.full_name || 'Paciente';
      const message = `¡Tu cita ha sido confirmada! 🦷

${patientName}, tu reserva para ${serviceType} está confirmada.

📅 Fecha y hora: ${new Date(startTime).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'full', timeStyle: 'short' })}

📍 Clínica Dental Sonrisa

Si necesitas cancelar o reagendar, responde a este mensaje.`;

      await sendWhatsAppMessage(appointment.phone_number, message);
      console.log('Confirmation message sent to:', appointment.phone_number);
    } catch (msgError) {
      console.error('Error sending confirmation message:', msgError);
    }
  }

  return { success: true, message: 'Booking created handled' };
}

// Handle BOOKING_CANCELLED event
async function handleBookingCancelled(payload: any) {
  const { data: { booking } } = payload;

  console.log('Handling BOOKING_CANCELLED:', booking);

  const bookingUid = booking.uid;

  // Find and update appointment
  const { error: updateError } = await supabaseService
    .from('appointments')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('cal_booking_uid', bookingUid);

  if (updateError) {
    console.error('Error updating appointment:', updateError);
    return { error: 'Error updating appointment' };
  }

  console.log('Appointment cancelled successfully');
  return { success: true, message: 'Booking cancelled handled' };
}

// Handle BOOKING_RECHEDULED event
async function handleBookingRescheduled(payload: any) {
  const { data: { booking } } = payload;

  console.log('Handling BOOKING_RECHEDULED:', booking);

  const bookingUid = booking.uid;
  const newStartTime = booking.startTime;

  // Find and update appointment with new time
  const { error: updateError } = await supabaseService
    .from('appointments')
    .update({
      appointment_date: newStartTime,
      updated_at: new Date().toISOString(),
    })
    .eq('cal_booking_uid', bookingUid);

  if (updateError) {
    console.error('Error updating appointment:', updateError);
    return { error: 'Error updating appointment' };
  }

  // Optionally send confirmation of reschedule via WhatsApp
  const { data: appointment } = await supabaseService
    .from('appointments')
    .select('*')
    .eq('cal_booking_uid', bookingUid)
    .single();

  if (appointment && appointment.phone_number) {
    try {
      const message = `Tu cita ha sido reagendada. 📅

Nueva fecha y hora: ${new Date(newStartTime).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'full', timeStyle: 'short' })}

Si necesitas hacer más cambios, responde a este mensaje.`;

      await sendWhatsAppMessage(appointment.phone_number, message);
      console.log('Reschedule confirmation sent to:', appointment.phone_number);
    } catch (msgError) {
      console.error('Error sending reschedule confirmation:', msgError);
    }
  }

  console.log('Appointment rescheduled successfully');
  return { success: true, message: 'Booking rescheduled handled' };
}

// POST handler - Receive Cal.com webhooks
export async function POST(request: NextRequest) {
  console.log('Cal.com webhook POST - Event received');

  // Verify webhook authenticity
  if (!verifyCalWebhook(request)) {
    console.error('Unauthorized Cal.com webhook attempt');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const payload = await request.json();
    console.log('Cal.com webhook payload:', JSON.stringify(payload, null, 2));

    const triggerEvent = payload.triggerEvent;

    let result;

    switch (triggerEvent) {
      case 'BOOKING_CREATED':
        result = await handleBookingCreated(payload);
        break;
      case 'BOOKING_CANCELLED':
        result = await handleBookingCancelled(payload);
        break;
      case 'BOOKING_RECHEDULED':
        result = await handleBookingRescheduled(payload);
        break;
      default:
        console.log('Unhandled event type:', triggerEvent);
        result = { message: `Event ${triggerEvent} not handled` };
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error processing Cal.com webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
