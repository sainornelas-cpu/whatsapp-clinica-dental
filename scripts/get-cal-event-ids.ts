// Script para obtener los event type IDs de Cal.com
// Ejecutar con: npx ts-node scripts/get-cal-event-ids.ts

const CAL_API_KEY = process.env.CAL_API_KEY;
const CAL_USER = 'alfredo-sain-ornelas-almeida-e6i0wr';

async function getEventTypes() {
  try {
    const response = await fetch(`https://api.cal.com/v2/event-types?apiKey=${CAL_API_KEY}`);
    const data = await response.json();

    if (!response.ok) {
      console.error('Error fetching event types:', data);
      return;
    }

    console.log('Event Types encontrados:');
    console.log('='.repeat(80));

    const eventSlugs = [
      'atencion-de-urgencia',
      'extraccion-dental',
      'ortodoncia',
      'blanqueamiento-dental',
      'consulta-general',
      'limpieza-dental-profesional',
    ];

    const eventTypes = data.eventTypes || data;

    for (const eventType of eventTypes) {
      const slug = eventType.slug;
      if (eventSlugs.includes(slug)) {
        console.log(`\n📅 ${eventType.title}`);
        console.log(`   Slug: ${slug}`);
        console.log(`   Event Type ID: ${eventType.id}`);
        console.log(`   Duración: ${eventType.length} minutos`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\nVariables de entorno para .env.local:');
    console.log('='.repeat(80));

    for (const eventType of eventTypes) {
      const slug = eventType.slug;
      if (eventSlugs.includes(slug)) {
        const envVar = slug
          .toUpperCase()
          .replace(/-/g, '_')
          .replace('ATENCION_DE_URGENCIA', 'URGENCIA')
          .replace('EXTRACCION_DENTAL', 'EXTRACCION')
          .replace('LIMPIEZA_DENTAL_PROFESIONAL', 'LIMPIEZA')
          .replace('CONSULTA_GENERAL', 'CONSULTA')
          .replace('BLANQUEAMIENTO_DENTAL', 'BLANQUEAMIENTO');

        console.log(`CAL_EVENT_TYPE_${envVar}=${eventType.id}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

getEventTypes();
