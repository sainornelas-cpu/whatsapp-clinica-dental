// Script para obtener los event type IDs de Cal.com
// Ejecutar con: node scripts/get-cal-event-ids.js

const CAL_API_KEY = process.env.CAL_API_KEY;

async function getEventTypes() {
  try {
    const response = await fetch('https://api.cal.com/v2/event-types', {
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

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

    // Los eventos están en data.data.eventTypeGroups[0].eventTypes
    const eventTypeGroups = data.data?.eventTypeGroups || [];
    const eventTypes = eventTypeGroups.length > 0 ? eventTypeGroups[0].eventTypes || [] : [];

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

    const mapping = {
      'atencion-de-urgencia': 'URGENCIA',
      'extraccion-dental': 'EXTRACCION',
      'ortodoncia': 'ORTODONCIA',
      'blanqueamiento-dental': 'BLANQUEAMIENTO',
      'consulta-general': 'CONSULTA',
      'limpieza-dental-profesional': 'LIMPIEZA',
    };

    for (const eventType of eventTypes) {
      const slug = eventType.slug;
      const envVar = mapping[slug];

      if (envVar) {
        console.log(`CAL_EVENT_TYPE_${envVar}=${eventType.id}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

getEventTypes();
