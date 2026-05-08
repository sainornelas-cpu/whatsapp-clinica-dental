// Script completo de prueba del webhook
// Simula el proceso completo para detectar errores

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Variables de prueba
const TEST_PHONE = '+521234567890';
const TEST_SERVICE = 'limpieza dental';

// Simular datos del prompt del agente
const agentPrompt = `Eres Sofia, la asistente virtual de Clínica Dental Sonrisa. Eres amable, profesional y eficiente.

# PROCESO PARA RESERVAR CITA
IMPORTANTE: Las reservas se completan a través de un link de Cal.com que el paciente debe usar para confirmar.

1. Pregunta qué servicio necesita el paciente (con opciones numéricas).
2. Usa la herramienta \`book_appointment\` con el servicio y número de teléfono.
3. La herramienta generará un link de reserva de Cal.com.
4. Envía el link al paciente para que complete la reserva con TODOS sus datos.
5. Indica al paciente: "Por favor completa tu reserva usando el link. Una vez completada, te confirmaré tu cita."

# FLUJO CORRECTO:
- Si el paciente NO menciona servicio → Pregunta: "¿Qué servicio necesitas?" (con opciones numeradas)
- Si el paciente SÍ menciona servicio → Genera link directamente

RESPUESTA AL AGENDAR (EJEMPLO EXACTO):
\`\`\`
Perfecto, para tu limpieza dental, por favor completa tu reserva aquí:

https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/limpieza-dental-profesional

Una vez que completes la reserva, te confirmaré los detalles.
\`\`\`
`;

// Links de Cal.com
const CAL_BOOKING_LINKS = {
  'limpieza dental': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/limpieza-dental-profesional',
  'limpieza': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/limpieza-dental-profesional',
  'consulta general': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/consulta-general',
  'consulta': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/consulta-general',
  'blanqueamiento dental': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/blanqueamiento-dental',
  'blanqueamiento': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/blanqueamiento-dental',
  'ortodoncia': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/ortodoncia',
  'extracción dental': 'https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/extraccion-dental',
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

// Configurar Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('=== PRUEBA COMPLETA DEL WEBHOOK ===\n');

// TEST 1: Probar generación de link
console.log('TEST 1: Probar getCalBookingLink()');
const bookingLink = getCalBookingLink(TEST_SERVICE);
console.log(`Servicio: ${TEST_SERVICE}`);
console.log(`Link: ${bookingLink}`);
if (!bookingLink) {
  console.log('❌ FAIL: No se generó el link');
} else {
  console.log('✅ PASS: Link generado correctamente');
}
console.log('');

// TEST 2: Probar inserción en Supabase
console.log('TEST 2: Probar inserción en Supabase');
const calBookingUid = `test_${Date.now()}`;

try {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      phone_number: TEST_PHONE,
      cal_booking_uid: calBookingUid,
      service_type: TEST_SERVICE,
      appointment_date: new Date().toISOString(),
      status: 'pending',
      notes: `Link de booking: ${bookingLink}`,
    })
    .select();

  if (error) {
    console.log('❌ FAIL: Error insertando en Supabase');
    console.log(JSON.stringify(error, null, 2));
  } else {
    console.log('✅ PASS: Inserción exitosa en Supabase');
    console.log('Cita insertada:', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.log('❌ FAIL: Error inesperado en Supabase');
  console.log(error.message);
}
console.log('');

// TEST 3: Simular llamada a OpenAI
console.log('TEST 3: Simular llamada a OpenAI con function calling');

try {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: agentPrompt
      },
      {
        role: 'user',
        content: `Quiero agendar una cita de ${TEST_SERVICE}. Mi teléfono es ${TEST_PHONE}`
      }
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'book_appointment',
          description: 'Generate a booking link for patient to complete their appointment reservation on Cal.com. Use this when patient wants to schedule an appointment. Only requires service_type and phone_number - patient completes all other details on Cal.com.',
          parameters: {
            type: 'object',
            properties: {
              service_type: { type: 'string', description: 'Type of dental service' },
              phone: { type: 'string', description: 'Patient phone number' },
            },
            required: ['service_type', 'phone'],
          },
        },
      },
    ],
    tool_choice: 'auto',
  });

  const assistantMessage = completion.choices[0].message;
  console.log('Respuesta de OpenAI:');
  console.log('----------------');
  console.log('Content:', assistantMessage.content);
  console.log('Tool calls:', assistantMessage.tool_calls ? 'YES' : 'NO');

  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    console.log('\nDetalle de tool calls:');
    for (const toolCall of assistantMessage.tool_calls) {
      const functionCall = toolCall.function;
      const functionArgs = JSON.parse(functionCall.arguments);
      console.log(`- Function: ${functionCall.name}`);
      console.log(`- Arguments:`, functionArgs);
    }
  }

} catch (error) {
  console.log('❌ FAIL: Error llamando a OpenAI');
  console.log(error.message);
  console.log('\n¿Está configurada la variable OPENAI_API_KEY?');
  console.log('Valor configurado:', process.env.OPENAI_API_KEY ? 'YES (longitud: ' + process.env.OPENAI_API_KEY.length + ')' : 'NO');
}

console.log('\n=== RESUMEN ===');
console.log('Revisa los logs anteriores para detalles de cada test.');
