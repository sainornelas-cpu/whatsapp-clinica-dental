import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseService } from '@/lib/supabase';
import { getCalBookingLink } from '@/lib/cal-links';
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

// Function to get or create conversation
async function getOrCreateConversation(phoneNumber: string) {
  try {
    let { data: conversation, error } = await supabaseService
      .from('conversations')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error || !conversation) {
      const { data: newConversation, error: insertError } = await supabaseService
        .from('conversations')
        .insert({ phone_number: phoneNumber })
        .select()
        .single();

      if (insertError) throw insertError;
      conversation = newConversation;
    }

    return conversation;
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

    // Get or create conversation
    const conversation = await getOrCreateConversation(phoneNumber);

    // Store user message
    await storeMessage(conversation.id, 'user', messageText);

    // Load conversation history for context
    const history = await loadConversationHistory(conversation.id, 10);

    // Prepare messages for OpenAI
    const messages: any[] = [
      { role: 'system', content: agentPrompt },
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
            description: 'Generate a booking link for the patient to complete their appointment reservation on Cal.com. Use this when the patient wants to schedule an appointment. Only requires service_type and phone_number - patient completes all other details on Cal.com.',
            parameters: {
              type: 'object',
              properties: {
                service_type: { type: 'string', description: 'Type of dental service (limpieza, consulta, blanqueamiento, ortodoncia, extracción, urgencia)' },
                phone: { type: 'string', description: 'Patient phone number' },
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
            description: 'Cancel an appointment by booking UID. Marks the appointment as cancelled in the database. Use when patient wants to cancel a specific appointment. Requires booking_uid from get_my_appointments.',
            parameters: {
              type: 'object',
              properties: {
                booking_uid: { type: 'string', description: 'The unique booking UID of the appointment to cancel' },
              },
              required: ['booking_uid'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'reschedule_appointment',
            description: 'Provide instructions to reschedule an appointment. Returns the Cal.com link for the patient to reschedule.',
            parameters: {
              type: 'object',
              properties: {
                booking_uid: { type: 'string', description: 'The unique booking UID of the appointment to reschedule' },
              },
              required: ['booking_uid'],
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

async function bookAppointment(params: any) {
  try {
    const { service_type, phone } = params;

    // Generate unique booking UID
    const calBookingUid = `booking_${randomUUID()}`;

    // Obtener el link de booking según el servicio
    const bookingLink = getCalBookingLink(service_type);

    if (!bookingLink) {
      console.error('No booking link found for service:', service_type);
      return { error: `No se encontró configuración para el servicio: ${service_type}` };
    }

    // Insert appointment in Supabase como pendiente de confirmación
    const { error: appointmentError } = await supabaseService
      .from('appointments')
      .insert({
        phone_number: phone,
        cal_booking_uid: calBookingUid,
        service_type,
        appointment_date: new Date().toISOString(), // Will be updated by Cal.com webhook
        status: 'pending',
        notes: `Link de booking: ${bookingLink}`,
      });

    if (appointmentError) {
      console.error('Error inserting appointment:', appointmentError);
    }

    // Retornar el link de booking para que el usuario complete la reserva
    return {
      success: true,
      bookingLink,
      calBookingUid,
      message: `Para completar tu reserva de ${service_type}, por favor usa el siguiente link: ${bookingLink}`,
    };
  } catch (error) {
    console.error('Error booking appointment:', error);
    return { error: 'Error al generar link de reserva' };
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
      appointments: appointments.map((apt: any) => ({
        id: apt.id,
        cal_booking_uid: apt.cal_booking_uid,
        service_type: apt.service_type,
        appointment_date: apt.appointment_date,
        status: apt.status === 'pending' ? 'pendiente de confirmación' : 'confirmada',
        booking_link: apt.notes?.match(/https?:\/\/[^\s]+/)?.[0] || null,
      })),
    };
  } catch (error) {
    console.error('Error getting appointments:', error);
    return { error: 'Error al obtener tus citas' };
  }
}

async function cancelAppointment(params: any) {
  try {
    const { booking_uid } = params;

    // Get appointment details first
    const { data: appointment, error: findError } = await supabaseService
      .from('appointments')
      .select('*')
      .eq('cal_booking_uid', booking_uid)
      .single();

    if (findError || !appointment) {
      return { error: 'No se encontró la cita.' };
    }

    // Cancel the appointment in database
    const { error: updateError } = await supabaseService
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('cal_booking_uid', booking_uid);

    if (updateError) {
      console.error('Error cancelling appointment in database:', updateError);
      return { error: 'Error al cancelar la cita.' };
    }

    console.log(`Appointment ${booking_uid} cancelled successfully`);

    // Extract booking link from notes for Cal.com cancellation
    const bookingLink = appointment.notes?.match(/https?:\/\/[^\s]+/)?.[0];

    let message = `✅ Tu cita de ${appointment.service_type} ha sido cancelada.`;

    if (bookingLink) {
      message += `\n\n💡 Nota: También puedes cancelar en Cal.com usando este link si lo necesitas:\n${bookingLink}`;
    }

    message += '\n\n¿Puedo ayudarte con algo más?';

    return {
      success: true,
      cancelled: true,
      service_type: appointment.service_type,
      message,
    };
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return { error: 'Error al procesar la cancelación' };
  }
}

async function rescheduleAppointment(params: any) {
  try {
    const { booking_uid } = params;

    // Get appointment details
    const { data: appointment, error } = await supabaseService
      .from('appointments')
      .select('*')
      .eq('cal_booking_uid', booking_uid)
      .single();

    if (error || !appointment) {
      return { error: 'No se encontró la cita.' };
    }

    // Extract booking link from notes
    const bookingLink = appointment.notes?.match(/https?:\/\/[^\s]+/)?.[0];

    if (bookingLink) {
      return {
        success: true,
        message: `Para reagendar tu cita de ${appointment.service_type}, usa este link: ${bookingLink}`,
        bookingLink,
      };
    } else {
      return {
        success: true,
        message: 'Para reagendar tu cita, por favor contáctanos directamente o revisa el email de confirmación de Cal.com.',
      };
    }
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return { error: 'Error al procesar el reagendamiento' };
  }
}
