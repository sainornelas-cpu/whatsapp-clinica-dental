// Script para verificar conversaciones en Supabase
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');

  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  return env;
}

const env = loadEnvFile();

async function checkConversations() {
  console.log('💬 Verificando conversaciones en Supabase...\n');

  // Verificar conversaciones
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/conversations?select=*&order=updated_at.desc&limit=10`, {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (response.ok) {
      const conversations = await response.json();

      console.log(`📊 Conversaciones encontradas: ${conversations.length}\n`);

      if (conversations.length === 0) {
        console.log('⚠️  No hay conversaciones registradas aún.');
        console.log('   Esto significa que el webhook no ha recibido mensajes o no los está guardando.\n');
        return;
      }

      for (const conv of conversations) {
        console.log(`📱 Teléfono: ${conv.phone_number}`);
        console.log(`   ID: ${conv.id}`);
        console.log(`   Paciente ID: ${conv.patient_id || 'N/A'}`);
        console.log(`   Última actualización: ${new Date(conv.updated_at).toLocaleString('es-MX')}`);

        // Verificar mensajes de esta conversación
        const msgsResponse = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${conv.id}&order=created_at.asc&limit=5`, {
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        });

        if (msgsResponse.ok) {
          const messages = await msgsResponse.json();
          console.log(`   Mensajes: ${messages.length}`);

          if (messages.length > 0) {
            console.log(`   Últimos mensajes:`);
            messages.slice(-3).forEach(msg => {
              const preview = msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content;
              console.log(`      [${msg.role}] ${preview}`);
            });
          }
        }
        console.log('');
      }
    } else {
      console.log('❌ Error obteniendo conversaciones:', await response.text());
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkConversations();
