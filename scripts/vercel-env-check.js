// Script para verificar que las variables de entorno estén configuradas
// Este script es para referencia - debe ejecutarse en Vercel

const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': 'URL de Supabase (pública)',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Anon Key de Supabase (pública)',
  'SUPABASE_SERVICE_ROLE_KEY': 'Service Role Key de Supabase (privada)',
  'OPENAI_API_KEY': 'API Key de OpenAI (privada)',
  'WHATSAPP_ACCESS_TOKEN': 'Access Token de WhatsApp (privada)',
  'WHATSAPP_PHONE_NUMBER_ID': 'Phone Number ID de WhatsApp (privada)',
  'WHATSAPP_VERIFY_TOKEN': 'Verify Token de WhatsApp (privada)',
  'CAL_API_KEY': 'API Key de Cal.com (privada)',
  'CAL_EVENT_TYPE_LIMPIEZA': 'Event Type ID de Limpieza (privada)',
  'CAL_EVENT_TYPE_CONSULTA': 'Event Type ID de Consulta (privada)',
  'CAL_EVENT_TYPE_BLANQUEAMIENTO': 'Event Type ID de Blanqueamiento (privada)',
  'CAL_EVENT_TYPE_ORTODONCIA': 'Event Type ID de Ortodoncia (privada)',
  'CAL_EVENT_TYPE_EXTRACCION': 'Event Type ID de Extracción (privada)',
  'CAL_EVENT_TYPE_URGENCIA': 'Event Type ID de Urgencia (privada)',
  'CRON_SECRET': 'Secret para cron jobs (privada)',
};

console.log('📋 Variables de entorno requeridas en Vercel:\n');
console.log('='.repeat(80));

for (const [key, description] of Object.entries(requiredVars)) {
  const isPublic = key.startsWith('NEXT_PUBLIC_');
  const type = isPublic ? 'Pública' : 'Privada';
  console.log(`\n${type}: ${key}`);
  console.log(`  ${description}`);
}

console.log('\n' + '='.repeat(80));
console.log('\nPara verificar en Vercel:');
console.log('1. Ve a tu proyecto en Vercel Dashboard');
console.log('2. Settings > Environment Variables');
console.log('3. Asegúrate de que todas las variables estén configuradas');
console.log('\n' + '='.repeat(80));
