import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseService } from '@/lib/supabase';
import { getCalBookingLink } from '@/lib/cal-links';
import {
  createGCEvent,
  cancelGCEvent,
  rescheduleGCEvent,
  getGCAvailability,
  formatGCDate,
  getGCDuration,
} from '@/lib/google-calendar';
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

    // Prepare messages for OpenAI - add phone number to system prompt for context
    const systemPromptWithPhone = `${agentPrompt}\n\nINFORMACIÓN DEL PACIENTE ACTUAL:\n- Número de teléfono: ${phoneNumber}`;

    const messages: any[] = [
      { role: 'system', content: systemPromptWithPhone },
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
            description: 'Create an appointment automatically via Google Calendar API. Use this when patient wants to schedule an appointment. Only requires service_type and phone_number - appointment is created immediately.',
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
            description: 'Cancel an appointment automatically via Google Calendar API. Patient just needs to confirm which appointment to cancel.',
            parameters: {
              type: 'object',
              properties: {
                phone: { type: 'string', description: 'Patient phone number (from context)' },
                appointment_id: { type: 'string', description: 'Optional: Specific appointment ID to cancel' },
              },
              required: ['phone'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'reschedule_appointment',
            description: 'Reschedule an appointment automatically via Google Calendar API. Can show available time slots. Patient selects new date and time.',
            parameters: {
              type: 'object',
              properties: {
                phone: { type: 'string', description: 'Patient phone number (from context)' },
                appointment_id: { type: 'string', description: 'Optional: Specific appointment ID to reschedule' },
                new_date: { type: 'string', description: 'Optional: New date and time for appointment (ISO format)' },
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

async function bookAppointment(params: any) {
  try {
    const { service_type, phone } = params;
    const duration = getGCDuration(service_type);

    // Create appointment in Google Calendar
    const gcEvent = await createGCEvent({
      service: service_type,
      phone,
      datetime: new Date().toISOString(),
      duration,
    });

    if (!gcEvent.id) {
      console.error('No se pudo crear evento en Google Calendar');
      return { error: 'No se pudo agendar la cita. Por favor intenta más tarde.' };
    }

    // Insert appointment in Supabase con referencia al evento de Google Calendar
    const { error: appointmentError } = await supabaseService
      .from('appointments')
      .insert({
        phone_number: phone,
        service_type,
        appointment_date: gcEvent.start?.dateTime || new Date().toISOString(),
        status: 'scheduled',
        gc_event_id: gcEvent.id,
      });

    if (appointmentError) {
      console.error('Error inserting appointment:', appointmentError);
      return { error: 'No se pudo agendar la cita. Por favor intenta más tarde.' };
    }

    return {
      success: true,
      appointment_id: gcEvent.id,
      message: `✅ Cita agendada exitosamente!\n\n${service_type}\n${formatGCDate(gcEvent.start?.dateTime || '')}\n\nTe enviaré un recordatorio 1 día antes y 1 hora antes de tu cita.`,
    };
  } catch (error) {
    console.error('Error booking appointment:', error);
    return { error: 'Error al generar la cita' };
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
        service_type: apt.service_type,
        appointment_date: apt.appointment_date,
        status: apt.status,
      })),
    };
  } catch (error) {
    console.error('Error getting appointments:', error);
    return { error: 'Error al obtener tus citas' };
  }
}

async function cancelAppointment(params: any) {
  try {
    const { phone, appointment_id } = params;

    console.log(`Getting appointments for cancellation, phone: ${phone}, appointment_id: ${appointment_id}`);

    // Get appointments for this patient
    const { data: appointments, error: findError } = await supabaseService
      .from('appointments')
      .select('*')
      .eq('phone_number', phone)
      .in('status', ['scheduled', 'pending'])
      .order('appointment_date', { ascending: true });

    if (findError) throw findError;

    if (!appointments || appointments.length === 0) {
      return { error: 'No tienes citas programadas.' };
    }

    // Seleccionar la próxima (o la especificada)
    const aptToCancel = appointment_id
      ? appointments.find((a: any) => a.id === appointment_id)
      : appointments[0];

    if (!aptToCancel) {
      return { error: appointment_id ? 'Cita no encontrada' : 'No tienes citas programadas' };
    }

    if (!aptToCancel.gc_event_id) {
      return { error: 'Esta cita no se puede cancelar desde el bot (no tiene evento de Google Calendar).' };
    }

    // Cancelar en Google Calendar
    const success = await cancelGCEvent(aptToCancel.gc_event_id);
    if (!success) {
      return { error: 'Error al cancelar en Google Calendar' };
    }

    // Actualizar en Supabase
    const { error: updateError } = await supabaseService
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', aptToCancel.id);

    if (updateError) throw updateError;

    return {
      success: true,
      message: `✅ Cita ${aptToCancel.service_type} cancelada exitosamente.`,
    };
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return { error: 'Error al cancelar la cita' };
  }
}

async function rescheduleAppointment(params: any) {
  try {
    const { phone, appointment_id, new_date } = params;

    console.log(`Getting appointments for rescheduling, phone: ${phone}, appointment_id: ${appointment_id}, new_date: ${new_date}`);

    // Get appointments for this patient
    const { data: appointments, error: findError } = await supabaseService
      .from('appointments')
      .select('*')
      .eq('phone_number', phone)
      .in('status', ['scheduled', 'pending'])
      .order('appointment_date', { ascending: true });

    if (findError) throw findError;

    if (!appointments || appointments.length === 0) {
      return { error: 'No tienes citas programadas.' };
    }

    const aptToReschedule = appointment_id
      ? appointments.find((a: any) => a.id === appointment_id)
      : appointments[0];

    if (!aptToReschedule) {
      return { error: appointment_id ? 'Cita no encontrada' : 'No tienes citas programadas' };
    }

    // Si no hay nueva fecha, mostrar disponibilidad
    if (!new_date) {
      if (!aptToReschedule.gc_event_id) {
        return { error: 'Esta cita no se puede reagendar desde el bot.' };
      }

      const today = new Date().toISOString().split('T')[0];
      const duration = getGCDuration(aptToReschedule.service_type);
      const availability = await getGCAvailability(today, duration);

      if (availability.length === 0) {
        return { error: 'No hay horarios disponibles para hoy.' };
      }

      const slots = availability.slice(0, 5).map((slot, i) => ({
        number: i + 1,
        time: formatGCDate(slot.start),
        datetime: slot.start,
      }));

      return {
        needs_date_selection: true,
        appointment_id: aptToReschedule.id,
        message: `Selecciona nuevo horario para ${aptToReschedule.service_type}:`,
        available_slots: slots,
      };
    }

    // Reagendar en Google Calendar
    const duration = getGCDuration(aptToReschedule.service_type);
    const updatedEvent = await rescheduleGCEvent(
      aptToReschedule.gc_event_id,
      new_date,
      duration
    );

    if (!updatedEvent.id) {
      return { error: 'Error al reagendar en Google Calendar' };
    }

    // Actualizar en Supabase
    const { error: updateError } = await supabaseService
      .from('appointments')
      .update({
        appointment_date: updatedEvent.start?.dateTime || new_date,
      })
      .eq('id', aptToReschedule.id);

    if (updateError) throw updateError;

    return {
      success: true,
      message: `✅ Cita reagendada exitosamente para ${formatGCDate(updatedEvent.start?.dateTime || '')}.`,
    };
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return { error: 'Error al reagendar la cita' };
  }
}
