# WhatsApp AI Dental Clinic Agent

Sistema completo de asistente virtual de WhatsApp para Clínica Dental Sonrisa con dashboard de administración.

## 🚀 Características

- **Asistente virtual AI (Sofia)**: Responde preguntas de pacientes vía WhatsApp
- **Gestión de citas**: Reserva, cancela y reagenda citas automáticamente
- **Integración con Cal.com**: Gestión de agenda y disponibilidad
- **Base de datos Supabase**: Almacenamiento de pacientes, citas y conversaciones
- **Recordatorios automáticos**: Sistema de cron job para recordatorios de citas
- **Dashboard de administración**: Panel completo para gestionar el negocio
- **Tiempo real**: Actualizaciones en vivo usando Supabase Realtime

## 📋 Requisitos previos

- Cuenta de [Meta for Developers](https://developers.facebook.com/) (WhatsApp Cloud API)
- Cuenta de [Cal.com](https://cal.com/) para gestión de citas
- Cuenta de [Supabase](https://supabase.com/) para base de datos
- API Key de [OpenAI](https://openai.com/)

## 🔧 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd whatsapp-clinica-dental
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.local.example .env.local
   ```

   Edita `.env.local` y completa las variables:
   ```env
   # WhatsApp Cloud API
   WHATSAPP_ACCESS_TOKEN=tu_token_de_acceso
   WHATSAPP_PHONE_NUMBER_ID=tu_id_de_numero
   WHATSAPP_VERIFY_TOKEN=tu_token_de_verificacion

   # OpenAI
   OPENAI_API_KEY=tu_api_key_de_openai

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
   SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio

   # Cal.com
   CAL_API_KEY=tu_api_key_de_cal
   CAL_EVENT_TYPE_ID=tu_id_de_tipo_de_evento

   # Cron Job Security
   CRON_SECRET=tu_secreto_para_cron
   ```

4. **Configurar base de datos Supabase**
   - Ve a tu proyecto en Supabase
   - Ejecuta el SQL en `supabase/schema.sql` en el SQL Editor
   - Asegúrate de que las políticas RLS estén configuradas correctamente

## 🚢 Despliegue

### Despliegue en Vercel

1. **Instalar Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Desplegar**
   ```bash
   vercel
   ```

3. **Configurar variables de entorno en Vercel**
   - Ve a tu proyecto en Vercel Dashboard
   - Settings > Environment Variables
   - Agrega todas las variables de `.env.local`

4. **Configurar Webhook de WhatsApp**
   - Ve a tu app de Meta for Developers
   - WhatsApp > Configuration
   - Webhook URL: `https://tu-dominio.vercel.app/api/webhook`
   - Webhook Verify Token: el mismo que en `WHATSAPP_VERIFY_TOKEN`
   - Suscríbete a los eventos: `messages`

5. **Configurar Cron Job**
   - El cron job ya está configurado en `vercel.json`
   - Vercel ejecutará `/api/cron/reminders` diariamente a las 10:00 AM
   - Asegúrate de configurar `CRON_SECRET` en Vercel

## 📱 Configuración de WhatsApp

1. **Crear una app en Meta for Developers**
   - Ve a https://developers.facebook.com/
   - Crea una nueva app
   - Selecciona "Business" y agrega el producto "WhatsApp"

2. **Configurar el número de WhatsApp**
   - Agrega tu número de teléfono de prueba
   - Obtuve el `Phone Number ID` y `Access Token`

3. **Configurar el Webhook**
   - Configura la URL del webhook
   - Usa el token de verificación que definiste

## 🗓️ Configuración de Cal.com

1. **Crear tipos de eventos**
   - Limpieza dental: 45 minutos
   - Consulta de revisión: 30 minutos
   - Blanqueamiento dental: 90 minutos
   - Ortodoncia: 60 minutos
   - Extracción simple: 45 minutos
   - Urgencias: 30 minutos

2. **Obtener API Key y Event Type IDs**
   - Ve a Configuración > Developer > API Keys
   - Copia tu API Key
   - Para cada tipo de evento, obtiene el `eventTypeId`

## 📊 Uso del Dashboard

1. **Iniciar sesión**
   - Ve a `https://tu-dominio.vercel.app/login`
   - Usa las credenciales de Supabase Auth

2. **Secciones del Dashboard**
   - **Conversaciones**: Ver todos los chats con pacientes
   - **Citas**: Gestión de citas (programadas, completadas, canceladas)
   - **Pacientes**: Lista de pacientes y su historial
   - **Analítica**: Estadísticas del negocio

## 🤖 Personalización del Agente AI

Edita `AGENT_PROMPT.md` para personalizar el comportamiento de Sofia:
- Servicios ofrecidos
- Horarios de atención
- Políticas de cancelación
- Tono y comportamiento

## 🔐 Seguridad

- Usa `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor
- Usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el cliente
- Protege el cron job con `CRON_SECRET`
- Nunca compartas tus tokens y API keys

## 📝 Estructura del Proyecto

```
whatsapp-clinica-dental/
├── app/
│   ├── api/
│   │   ├── webhook/          # WhatsApp webhook endpoint
│   │   └── cron/
│   │       └── reminders/    # Cron job para recordatorios
│   ├── dashboard/            # Dashboard de administración
│   │   ├── conversations/    # Vista de conversaciones
│   │   ├── appointments/     # Gestión de citas
│   │   ├── patients/         # Gestión de pacientes
│   │   └── analytics/        # Analítica y estadísticas
│   └── login/                # Página de login
├── components/               # Componentes React
├── lib/                      # Utilidades (Supabase client)
├── supabase/
│   └── schema.sql            # Esquema de base de datos
├── AGENT_PROMPT.md          # Prompt del asistente AI
├── vercel.json              # Configuración de Vercel
└── .env.local.example       # Ejemplo de variables de entorno
```

## 🛠️ Tecnologías

- **Next.js 15** - Framework de React
- **TypeScript** - Tipado estático
- **Supabase** - Base de datos y autenticación
- **OpenAI GPT-4o** - Asistente virtual
- **Cal.com API** - Gestión de citas
- **WhatsApp Cloud API** - Mensajería
- **Tailwind CSS** - Estilos
- **Vercel** - Despliegue y hosting

## 📄 Licencia

Este proyecto es parte de un sprint de desarrollo web.

## 🆘 Soporte

Para problemas o preguntas:
- Revisa los logs en Vercel Dashboard
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que el webhook de WhatsApp esté configurado correctamente
- Verifica que la base de datos de Supabase tenga el esquema correcto
