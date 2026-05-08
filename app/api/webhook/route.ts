import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseService } from '@/lib/supabase';
import { getCalBookingLink } from '@/lib/cal-links';
import { getEventTypeId, getDuration, createCalBooking } from '@/lib/cal-api';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Read agent prompt
const agentPromptPath = path.join(process.cwd(), 'AGENT_PROMPT.md');
const agentPrompt = fs.existsSync(agentPromptPath)
  ? fs.readFileSync(agentPromptPath, 'utf-8')
  : 'Eres una asistente virtual de una clínica dental.';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GET handler - Meta webhook verification
export async function GET(request: NextRequest) {
  console.log('WhatsApp webhook GET - Verification request');

  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  console.error('Webhook verification failed');
  return new NextResponse('Forbidden', { status: 403 });
}

// Function to extract phone number and message from Meta payload
function extractMessage(payload: any) {
  try {
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) return null;

    // Extract phone number (sender)
    const phoneNumber = value.messages?.[0]?.from;
    const messageText = value.messages?.[0]?.text?.body;

    if (!phoneNumber || !messageText) return null;

    return { phoneNumber, messageText };
  } catch (error) {
    console.error('Error extracting message:', error);
    return null;
  }
}

// Function to send WhatsApp message
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

// Function to get or create patient
async function getOrCreatePatient(phoneNumber: string, name?: string) {
  try {
    let { data: patient, error } = await supabaseService
      .from('patients')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error || !patient) {
      const { data: newPatient, error: insertError } = await supabaseService
        .from('patients')
        .insert({
          phone_number: phoneNumber,
          full_name: name || 'Paciente',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      patient = newPatient;
    } else if (name && (!patient.full_name || patient.full_name === 'Paciente')) {
      // Update patient name if we have it and it's currently 'Paciente'
      const { data: updatedPatient, error: updateError } = await supabaseService
        .from('patients')
        .update({ full_name: name })
        .eq('id', patient.id)
        .select()
        .single();

      if (!updateError && updatedPatient) {
        patient = updatedPatient;
      }
    }

    return patient;
  } catch (error) {
    console.error('Error getting/creating patient:', error);
    throw error;
  }
}

// Function to get or create conversation
async function getOrCreateConversation(phoneNumber: string) {
  try {
    // First ensure patient exists
    const patient = await getOrCreatePatient(phoneNumber);

    let { data: conversation, error } = await supabaseService
      .from('conversations')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error || !conversation) {
      const { data: newConversation, error: insertError } = await supabaseService
        .from('conversations')
        .insert({
          phone_number: phoneNumber,
          patient_id: patient.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      conversation = newConversation;
    } else if (!conversation.patient_id) {
      // Update conversation with patient_id if missing
      const { data: updatedConversation, error: updateError } = await supabaseService
        .from('conversations')
        .update({ patient_id: patient.id })
        .eq('id', conversation.id)
        .select()
        .single();

      if (!updateError && updatedConversation) {
        conversation = updatedConversation;
      }
    }

    return { ...conversation, patient };
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }
}

// Function to store message
async function storeMessage(conversationId: string, role: string, content: string) {
  try {
    const { error } = await supabaseService
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error storing message:', error);
    throw error;
  }
}

// Function to load conversation history
async function loadConversationHistory(conversationId: string, limit: number = 10) {
  try {
    const { data, error } = await supabaseService
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.reverse().map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  } catch (error) {
    console.error('Error loading conversation history:', error);
    return [];
  }
}

// POST handler - Receive WhatsApp messages
export async function POST(request: NextRequest) {
  console.log('WhatsApp webhook POST - Message received');

  try {
    const payload = await request.json();
    const messageData = extractMessage(payload);

    if (!messageData) {
      console.log('No valid message found in payload');
      return new NextResponse('OK', { status: 200 });
    }

    const { phoneNumber, messageText } = messageData;

    console.log(`Message from ${phoneNumber}: ${messageText}`);

    // Get or create conversation (this also creates/updates patient)
    const conversationData = await getOrCreateConversation(phoneNumber);
    const conversation = { id: conversationData.id, phone_number: conversationData.phone_number };
    const patient = conversationData.patient;

    // Store user message
    await storeMessage(conversation.id, 'user', messageText);

    // Load conversation history for context
    const history = await loadConversationHistory(conversation.id, 10);

    // Prepare messages for OpenAI - add patient info to system prompt for context
    const systemPromptWithContext = `${agentPrompt}\n\nINFORMACIÓN DEL PACIENTE ACTUAL:\n- Nombre: ${patient.full_name || 'Paciente'}\n- Número de teléfono: ${phoneNumber}`;

    const messages: any[] = [
      { role: 'system', content: systemPromptWithContext },
      ...history,
      { role: 'user', content: messageText },
    ];

    // Call OpenAI with function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: [
        {
          type: 'function',
          function: {
            name: 'book_appointment',
            description: 'Create an appointment. If patient provides date and time, creates confirmed booking directly. Otherwise, generates booking link for patient to complete on Cal.com. Ask for date (YYYY-MM-DD format) and time (HH:MM format) to create confirmed booking.',
            parameters: {
              type: 'object',
              properties: {
                service_type: { type: 'string', description: 'Type of dental service (limpieza, consulta, blanqueamiento, ortodoncia, extracción, urgencia)' },
                phone: { type: 'string', description: 'Patient phone number' },
                date: { type: 'string', description: 'Date for the appointment in YYYY-MM-DD format (optional, but if provided, must include time)' },
                time: { type: 'string', description: 'Time for the appointment in HH:MM format (24-hour, optional, but if provided, must include date)' },
              },
              required: ['service_type', 'phone'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'get_my_appointments',
            description: 'Get all appointments for a patient. CRITICAL: Use IMMEDIATELY when patient asks ANYTHING about their appointments including: "mis citas", "ver citas", "citas", "qué día es mi cita", "cuándo tengo cita", "me recuerdas mi cita", "cuándo es mi próxima cita", "qué hora es mi cita", "cuándo me toca", "mi cita". NEVER say "I dont know" - ALWAYS call this function first to check.',
            parameters: {
              type: 'object',
              properties: {
                phone: { type: 'string', description: 'Patient phone number' },
              },
              required: ['phone'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'cancel_appointment',
            description: 'Provide Cal.com link for patient to manually cancel their appointment. SIMPLE METHOD: Show appointment options with Cal.com booking links - patient cancels directly from Cal.com.',
            parameters: {
              type: 'object',
              properties: {
                phone: { type: 'string', description: 'Patient phone number (from context)' },
              },
              required: ['phone'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'reschedule_appointment',
            description: 'Provide Cal.com links for patient to manually reschedule their appointment. SIMPLE METHOD: Show appointment options with Cal.com booking links - patient reschedules directly from Cal.com.',
            parameters: {
              type: 'object',
              properties: {
                phone: { type: 'string', description: 'Patient phone number (from context)' },
              },
              required: ['phone'],
            },
          },
        },
      ],
      tool_choice: 'auto',
    });

    const assistantMessage = completion.choices[0].message;
    let finalResponse = '';

    // Handle function calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults: any[] = [];

      for (const toolCall of assistantMessage.tool_calls) {
        const functionCall = toolCall.function;
        const functionName = functionCall.name;
        const functionArgs = JSON.parse(functionCall.arguments);

        console.log(`Tool call: ${functionName}`, functionArgs);

        let result;
        if (functionName === 'book_appointment') {
          result = await bookAppointment(functionArgs);
        } else if (functionName === 'get_my_appointments') {
          result = await getMyAppointments(functionArgs);
        } else if (functionName === 'cancel_appointment') {
          result = await cancelAppointment(functionArgs);
        } else if (functionName === 'reschedule_appointment') {
          result = await rescheduleAppointment(functionArgs);
        } else {
          result = { error: 'Unknown function' };
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify(result),
        });
      }

      // Get final response after tool calls
      const followUp = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          ...messages,
          assistantMessage,
          ...toolResults,
        ],
      });

      finalResponse = followUp.choices[0].message.content || 'Lo siento, hubo un error al procesar tu solicitud.';
    } else {
      finalResponse = assistantMessage.content || 'Lo siento, hubo un error al procesar tu solicitud.';
    }

    // Send response via WhatsApp
    await sendWhatsAppMessage(phoneNumber, finalResponse);

    // Store assistant message
    await storeMessage(conversation.id, 'assistant', finalResponse);

    console.log(`Response sent to ${phoneNumber}: ${finalResponse}`);

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Tool functions

// Generate Cal.com management link for an existing booking
// IMPORTANT: The correct format is /reschedule/{uid} or /cancel/{uid}
// Source: https://github.com/calcom/cal.com/issues/28829
function getCalManagementLink(bookingUid: string, serviceType?: string): string | null {
  if (!bookingUid) return null;

  // CRITICAL: If UID has "booking_" prefix, it's generated by us (not Cal.com)
  // and doesn't exist in Cal.com yet. Return null.
  // Real Cal.com UIDs don't have this prefix.
  if (bookingUid.startsWith('booking_')) {
    return null;
  }

  // Cal.com management link format: /reschedule/{uid}
  // This link allows both rescheduling AND cancelling
  // Source: GitHub Issue #28829
  return `https://app.cal.com/reschedule/${bookingUid}`;
}

async function bookAppointment(params: any) {
  try {
    const { service_type, phone, date, time } = params;

    // Get or create patient first
    const patient = await getOrCreatePatient(phone);

    // Si se proporcionan fecha y hora, crear el booking directamente en Cal.com
    if (date && time) {
      console.log(`Creating direct Cal.com booking: ${service_type}, ${date}, ${time}`);

      // Parsear fecha y hora
      const eventTypeId = getEventTypeId(service_type);
      if (!eventTypeId) {
        return { error: `No se encontró el servicio: ${service_type}` };
      }

      // Convertir fecha y hora a formato ISO UTC
      // Esperamos formato: "YYYY-MM-DD" y "HH:MM"
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);

      // Crear fecha en UTC
      const bookingDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
      const isoStart = bookingDate.toISOString();

      // Crear booking en Cal.com
      const calResult = await createCalBooking({
        eventTypeId,
        attendee: {
          name: patient.full_name || 'Paciente',
          email: `${phone}@whatsapp-temp.com`, // Email temporal
          timeZone: 'America/Mexico_City',
          phoneNumber: phone,
        },
        start: isoStart,
        duration: getDuration(service_type),
      });

      if (calResult.error) {
        console.error('Cal.com booking error:', calResult.error);
        return { error: calResult.error };
      }

      const calBookingData = calResult.data?.data || calResult.data;
      const calBookingUid = calBookingData?.uid || calBookingData?.booking?.uid;

      if (!calBookingUid) {
        console.error('No UID in Cal.com response:', calResult);
        return { error: 'Error: No se obtuvo UID de Cal.com' };
      }

      // Insert appointment en Supabase como CONFIRMADA
      const { error: appointmentError } = await supabaseService
        .from('appointments')
        .insert({
          patient_id: patient.id,
          phone_number: phone,
          cal_booking_uid: calBookingUid,
          service_type,
          appointment_date: isoStart,
          status: 'scheduled', // Confirmada inmediatamente
          notes: `Reserva creada directamente por API`,
        });

      if (appointmentError) {
        console.error('Error inserting appointment:', appointmentError);
        return { error: `Error al guardar cita: ${appointmentError.message}` };
      }

      // Formatear fecha para mostrar
      const dateStr = bookingDate.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        success: true,
        confirmed: true,
        message: `✅ ¡Tu cita ha sido confirmada!\n\n📅 ${service_type} - ${dateStr}\n📍 Clínica Dental Sonrisa\n\nSi necesitas cancelar o reagendar, simplemente escríbeme "cancelar" o "reagendar".`,
      };
    }

    // FALLBACK: Si no se proporcionan fecha y hora, usar el flujo con link
    console.log(`Using link-based booking for: ${service_type}`);

    const calBookingUid = `booking_${randomUUID()}`;
    const bookingLink = getCalBookingLink(service_type);

    if (!bookingLink) {
      console.error('No booking link found for service:', service_type);
      return { error: `No se encontró configuración para el servicio: ${service_type}` };
    }

    const bookingLinkWithPhone = `${bookingLink}?phoneNumber=${phone}`;

    const { error: appointmentError } = await supabaseService
      .from('appointments')
      .insert({
        patient_id: patient.id,
        phone_number: phone,
        cal_booking_uid: calBookingUid,
        service_type,
        appointment_date: new Date().toISOString(),
        status: 'pending',
        notes: `Link de booking: ${bookingLinkWithPhone}`,
      });

    if (appointmentError) {
      console.error('Error inserting appointment:', appointmentError);
      return { error: `Error al crear cita: ${appointmentError.message}` };
    }

    return {
      success: true,
      bookingLink: bookingLinkWithPhone,
      message: `Para completar tu reserva de ${service_type}, por favor usa el siguiente link: ${bookingLinkWithPhone}`,
    };
  } catch (error) {
    console.error('Error booking appointment:', error);
    return { error: 'Error al generar reserva' };
  }
}

async function getMyAppointments(params: any) {
  try {
    const { phone } = params;

    const { data: appointments, error } = await supabaseService
      .from('appointments')
      .select('*')
      .eq('phone_number', phone)
      .in('status', ['scheduled', 'pending'])
      .order('appointment_date', { ascending: true });

    if (error) throw error;

    if (!appointments || appointments.length === 0) {
      return { appointments: [], message: 'No tienes citas programadas.' };
    }

    return {
      appointments: appointments.map((apt: any) => {
        const managementLink = getCalManagementLink(apt.cal_booking_uid, apt.service_type);
        return {
          id: apt.id,
          cal_booking_uid: apt.cal_booking_uid,
          service_type: apt.service_type,
          appointment_date: apt.appointment_date,
          status: apt.status === 'pending' ? 'pendiente de confirmación' : 'confirmada',
          management_link: managementLink,
          booking_link: apt.notes?.match(/https?:\/\/[^\s]+/)?.[0] || null,
        };
      }),
    };
  } catch (error) {
    console.error('Error getting appointments:', error);
    return { error: 'Error al obtener tus citas' };
  }
}

async function cancelAppointment(params: any) {
  try {
    const { phone } = params;

    console.log(`Getting appointments for cancellation, phone: ${phone}`);

    // IMPORTANT: Only get CONFIRMED appointments (scheduled)
    // Pending appointments don't have valid Cal.com UIDs yet
    const { data: appointments, error: findError } = await supabaseService
      .from('appointments')
      .select('*')
      .eq('phone_number', phone)
      .eq('status', 'scheduled')  // Only confirmed appointments
      .order('appointment_date', { ascending: true });

    if (findError) throw findError;

    if (!appointments || appointments.length === 0) {
      return { error: 'No tienes citas confirmadas que se puedan cancelar. Las citas pendientes deben completarse primero en el link de reserva.' };
    }

    // Return appointments with their Cal.com management links
    // The patient will cancel directly from Cal.com
    const appointmentOptions = appointments.map((apt: any, index: number) => {
      const managementLink = getCalManagementLink(apt.cal_booking_uid, apt.service_type);
      const dateStr = new Date(apt.appointment_date).toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });

      if (managementLink) {
        return `${index + 1}. ${apt.service_type} - ${dateStr}

Para cancelar: ${managementLink}`;
      } else {
        return `${index + 1}. ${apt.service_type} - ${dateStr}

⚠️ Link de gestión no disponible. Por favor contáctanos directamente.`;
      }
    }).join('\n\n');

    return {
      success: true,
      message: `Para cancelar tu cita, selecciona una opción y usa el link correspondiente:\n\n${appointmentOptions}\n\nEl link te llevará a Cal.com donde podrás cancelar o reagendar tu cita.`,
    };
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return { error: 'Error al obtener información para cancelación' };
  }
}

async function rescheduleAppointment(params: any) {
  try {
    const { phone } = params;

    console.log(`Getting appointments for rescheduling, phone: ${phone}`);

    // IMPORTANT: Only get CONFIRMED appointments (scheduled)
    // Pending appointments don't have valid Cal.com UIDs yet
    const { data: appointments, error: findError } = await supabaseService
      .from('appointments')
      .select('*')
      .eq('phone_number', phone)
      .eq('status', 'scheduled')  // Only confirmed appointments
      .order('appointment_date', { ascending: true });

    if (findError) throw findError;

    if (!appointments || appointments.length === 0) {
      return { error: 'No tienes citas confirmadas que se puedan reagendar. Las citas pendientes deben completarse primero en el link de reserva.' };
    }

    // Return appointments with their Cal.com management links
    // The patient will reschedule directly from Cal.com
    const appointmentOptions = appointments.map((apt: any, index: number) => {
      const managementLink = getCalManagementLink(apt.cal_booking_uid, apt.service_type);
      const dateStr = new Date(apt.appointment_date).toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });

      if (managementLink) {
        return `${index + 1}. ${apt.service_type} - ${dateStr}

Para reagendar: ${managementLink}`;
      } else {
        return `${index + 1}. ${apt.service_type} - ${dateStr}

⚠️ Link de gestión no disponible. Por favor contáctanos directamente.`;
      }
    }).join('\n\n');

    return {
      success: true,
      message: `Para reagendar tu cita, selecciona una opción y usa el link correspondiente:\n\n${appointmentOptions}\n\nEl link te llevará a Cal.com donde podrás reagendar o cancelar tu cita.`,
    };
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return { error: 'Error al obtener información para reagendamiento' };
  }
}
