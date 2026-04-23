import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseService } from '@/lib/supabase';
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
            name: 'check_availability',
            description: 'Check available appointment slots for a given date and service type.',
            parameters: {
              type: 'object',
              properties: {
                date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
                service_type: { type: 'string', description: 'Type of dental service' },
              },
              required: ['date', 'service_type'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'book_appointment',
            description: 'Book a dental appointment for the patient.',
            parameters: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Patient full name' },
                email: { type: 'string', description: 'Patient email' },
                phone: { type: 'string', description: 'Patient phone number' },
                date_time: { type: 'string', description: 'Date and time in ISO8601 format' },
                service_type: { type: 'string', description: 'Type of dental service' },
                notes: { type: 'string', description: 'Additional notes' },
              },
              required: ['name', 'email', 'phone', 'date_time', 'service_type'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'cancel_appointment',
            description: 'Cancel an existing appointment.',
            parameters: {
              type: 'object',
              properties: {
                booking_uid: { type: 'string', description: 'Cal.com booking UID' },
                reason: { type: 'string', description: 'Reason for cancellation' },
              },
              required: ['booking_uid', 'reason'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'reschedule_appointment',
            description: 'Reschedule an existing appointment to a new date/time.',
            parameters: {
              type: 'object',
              properties: {
                booking_uid: { type: 'string', description: 'Cal.com booking UID' },
                new_date_time: { type: 'string', description: 'New date and time in ISO8601 format' },
              },
              required: ['booking_uid', 'new_date_time'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'get_patient_appointments',
            description: 'Retrieve upcoming appointments for a patient by phone number.',
            parameters: {
              type: 'object',
              properties: {
                phone_number: { type: 'string', description: 'Patient phone number' },
              },
              required: ['phone_number'],
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
        switch (functionName) {
          case 'check_availability':
            result = await checkAvailability(functionArgs.date, functionArgs.service_type);
            break;
          case 'book_appointment':
            result = await bookAppointment(functionArgs);
            break;
          case 'cancel_appointment':
            result = await cancelAppointment(functionArgs.booking_uid, functionArgs.reason);
            break;
          case 'reschedule_appointment':
            result = await rescheduleAppointment(functionArgs.booking_uid, functionArgs.new_date_time);
            break;
          case 'get_patient_appointments':
            result = await getPatientAppointments(functionArgs.phone_number);
            break;
          default:
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
    const url = `https://api.cal.com/v1/slots?apiKey=${process.env.CAL_API_KEY}&eventTypeId=${process.env.CAL_EVENT_TYPE_ID}&startTime=${date}T00:00:00Z&endTime=${date}T23:59:59Z`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('Cal.com API error:', data);
      return { error: 'No se pudo verificar disponibilidad. Por favor intenta más tarde.' };
    }

    return data;
  } catch (error) {
    console.error('Error checking availability:', error);
    return { error: 'Error al verificar disponibilidad' };
  }
}

async function bookAppointment(params: any) {
  try {
    const { name, email, phone, date_time, service_type, notes } = params;

    // Book with Cal.com
    const calUrl = `https://api.cal.com/v1/bookings?apiKey=${process.env.CAL_API_KEY}`;
    const calResponse = await fetch(calUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventTypeId: process.env.CAL_EVENT_TYPE_ID,
        start: date_time,
        name,
        email,
        smsReminderNumber: phone,
        notes: notes || `${service_type} - ${phone}`,
      }),
    });

    const calData = await calResponse.json();

    if (!calResponse.ok) {
      console.error('Cal.com booking error:', calData);
      return { error: 'No se pudo reservar la cita. Por favor intenta más tarde.' };
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

    // Insert appointment in Supabase
    const { error: appointmentError } = await supabaseService
      .from('appointments')
      .insert({
        patient_id: patient?.id,
        phone_number: phone,
        cal_booking_uid: calData.uid,
        service_type,
        appointment_date: date_time,
        status: 'scheduled',
        notes,
      });

    if (appointmentError) {
      console.error('Error inserting appointment:', appointmentError);
    }

    return { success: true, booking: calData };
  } catch (error) {
    console.error('Error booking appointment:', error);
    return { error: 'Error al reservar cita' };
  }
}

async function cancelAppointment(bookingUid: string, reason: string) {
  try {
    const url = `https://api.cal.com/v1/bookings/${bookingUid}?apiKey=${process.env.CAL_API_KEY}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cal.com cancel error:', data);
      return { error: 'No se pudo cancelar la cita. Por favor intenta más tarde.' };
    }

    // Update appointment status in Supabase
    const { error } = await supabaseService
      .from('appointments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('cal_booking_uid', bookingUid);

    if (error) {
      console.error('Error updating appointment status:', error);
    }

    return { success: true };
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return { error: 'Error al cancelar cita' };
  }
}

async function rescheduleAppointment(bookingUid: string, newDateTime: string) {
  try {
    const url = `https://api.cal.com/v1/bookings/${bookingUid}?apiKey=${process.env.CAL_API_KEY}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: newDateTime }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cal.com reschedule error:', data);
      return { error: 'No se pudo reagendar la cita. Por favor intenta más tarde.' };
    }

    // Update appointment in Supabase
    const { error } = await supabaseService
      .from('appointments')
      .update({
        appointment_date: newDateTime,
        updated_at: new Date().toISOString(),
      })
      .eq('cal_booking_uid', bookingUid);

    if (error) {
      console.error('Error updating appointment:', error);
    }

    return { success: true };
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return { error: 'Error al reagendar cita' };
  }
}

async function getPatientAppointments(phoneNumber: string) {
  try {
    const { data, error } = await supabaseService
      .from('appointments')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('status', 'scheduled')
      .gte('appointment_date', new Date().toISOString())
      .order('appointment_date', { ascending: true });

    if (error) throw error;

    return { appointments: data || [] };
  } catch (error) {
    console.error('Error getting patient appointments:', error);
    return { error: 'Error al obtener citas del paciente' };
  }
}