/**
 * Script para enviar un mensaje de prueba al webhook de WhatsApp
 * Útil para probar el flujo completo con un mensaje real
 */

const fs = require('fs');
const path = require('path');

// Read environment from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Archivo .env.local no encontrado');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
      env[key.trim()] = values.join('=').trim();
    }
  }
});

// Configuration
const WEBHOOK_URL = 'https://whatsapp-clinica-dental.vercel.app/api/webhook';
const YOUR_PHONE = process.env.TEST_PHONE || '+52TU_NUMERO'; // Cambiar a tu número real

// Test messages
const TEST_MESSAGES = [
  'hola',
  'quiero agendar una cita de limpieza',
  'mis citas',
  'cancelar',
];

async function sendTestMessage(message) {
  console.log('📤 Enviando mensaje de prueba al webhook...');
  console.log(`   URL: ${WEBHOOK_URL}`);
  console.log(`   Mensaje: "${message}"`);
  console.log(`   Teléfono: ${YOUR_PHONE}`);
  console.log('');

  try {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: '123456789',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            messages: [{
              from: YOUR_PHONE,
              id: 'wamid-' + Date.now(),
              timestamp: Math.floor(Date.now() / 1000),
              text: {
                body: message
              }
            }]
          }
        }]
      }]
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('✅ Mensaje enviado al webhook exitosamente');
      console.log(`   Status: ${response.status}`);
      console.log('');
      console.log('📱 Revisa tu WhatsApp para ver la respuesta del bot');
    } else {
      console.error('❌ Error al enviar mensaje');
      console.error(`   Status: ${response.status}`);
      console.error(`   Body: ${await response.text()}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Main
console.log('='.repeat(60));
console.log('🧪 PRUEBA DE MENSAJE WHATSAPP');
console.log('='.repeat(60));
console.log('');

const args = process.argv.slice(2);
const message = args[0] || TEST_MESSAGES[1]; // Default: booking message

sendTestMessage(message);
