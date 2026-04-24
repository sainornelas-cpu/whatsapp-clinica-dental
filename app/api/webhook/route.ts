import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseService } from '@/lib/supabase';
import { getCalEventType } from '@/lib/cal-config';
import { getCalBookingLink } from '@/lib/cal-links';
import fs from 'fs';
import path from 'path';

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
            description: 'Generate a booking link for the patient to complete their appointment reservation on Cal.com. Use this when the patient wants to schedule an appointment.',
            parameters: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Patient full name' },
                email: { type: 'string', description: 'Patient email (optional if not provided)' },
                phone: { type: 'string', description: 'Patient phone number' },
                date_time: { type: 'string', description: 'Preferred date and time (ISO8601 format or readable format)' },
                service_type: { type: 'string', description: 'Type of dental service (limpieza, consulta, blanqueamiento, ortodoncia, extracción, urgencia)' },
                notes: { type: 'string', description: 'Additional notes about the appointment' },
              },
              required: ['name', 'phone', 'service_type'],
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
async function checkAvailability(date: string, serviceType: string) {
  try {
    // Obtener el event type ID según el servicio
    const calConfig = getCalEventType(serviceType);

    if (!calConfig || !calConfig.eventTypeId) {
      console.error('No event type ID found for service:', serviceType);
      return { error: `No se encontró configuración para el servicio: ${serviceType}` };
    }

    const url = `https://api.cal.com/v1/slots?apiKey=${process.env.CAL_API_KEY}&eventTypeId=${calConfig.eventTypeId}&startTime=${date}T00:00:00Z&endTime=${date}T23:59:59Z`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('Cal.com API error:', data);
      return { error: 'No se pudo verificar disponibilidad. Por favor intenta más tarde.' };
    }

    // Agregar información del servicio a la respuesta
    return {
      ...data,
      serviceType,
      duration: calConfig.duration,
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    return { error: 'Error al verificar disponibilidad' };
  }
}

async function bookAppointment(params: any) {
  try {
    const { name, email, phone, date_time, service_type, notes } = params;

    // Obtener el link de booking según el servicio
    const bookingLink = getCalBookingLink(service_type);

    if (!bookingLink) {
      console.error('No booking link found for service:', service_type);
      return { error: `No se encontró configuración para el servicio: ${service_type}` };
    }

    // Upsert patient in Supabase
    const { error: patientError } = await supabaseService
      .from('patients')
      .upsert({
        phone_number: phone,
        full_name: name,
        email,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'phone_number',
      });

    if (patientError) {
      console.error('Error upserting patient:', patientError);
    }

    // Get patient ID
    const { data: patient } = await supabaseService
      .from('patients')
      .select('id')
      .eq('phone_number', phone)
      .single();

    // Insert appointment in Supabase como pendiente de confirmación
    const { error: appointmentError } = await supabaseService
      .from('appointments')
      .insert({
        patient_id: patient?.id,
        phone_number: phone,
        service_type,
        appointment_date: date_time,
        status: 'pending',
        notes: notes || `Link de booking: ${bookingLink}`,
      });

    if (appointmentError) {
      console.error('Error inserting appointment:', appointmentError);
    }

    // Retornar el link de booking para que el usuario complete la reserva
    return {
      success: true,
      bookingLink,
      message: `Para completar tu reserva de ${service_type}, por favor usa el siguiente link: ${bookingLink}`,
    };
  } catch (error) {
    console.error('Error booking appointment:', error);
    return { error: 'Error al generar link de reserva' };
  }
}