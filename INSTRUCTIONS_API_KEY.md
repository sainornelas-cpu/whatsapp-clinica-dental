# Instrucciones para Obtener Google Calendar API Key

## IMPORTANTE - DIFERENCIA ENTRE API KEY Y OAUTH CLIENT ID

**Lo que tienes ahora:**
- `287498500478-g46kaodsq9blpc8u1ln2lkjukh14lnlo.apps.googleusercontent.com`
- Esto es un **OAuth Client ID**, NO una API Key
- Format: `.apps.googleusercontent.com`

**Lo que necesitas:**
- Una **API Key** real de Google Cloud Console
- Format: `AIzaSy...` (empieza con "AIza")

---

## Pasos para Obtener la API Key (5 minutos)

### 1. Ir a Google Cloud Console
- Ve a: https://console.cloud.google.com/
- Inicia sesión con tu cuenta: `sain.ornelas@uabc.edu.mx`
- Si se pide crear/abrir un proyecto, selecciona el proyecto existente o crea uno nuevo llamado "WhatsApp Dental Bot"

### 2. Habilitar Google Calendar API
- Ve a: **APIs & Services** → **Library**
- Busca: `Google Calendar API`
- Haz clic en **Enable**

### 3. Crear la API Key
- Ve a: **APIs & Services** → **Credentials**
- Haz clic en el botón: **+ CREATE CREDENTIALS**
- Selecciona: **API Key**

### 4. Configurar la API Key
- Nombre: `WhatsApp Dental Bot API Key`
- Copia la API Key (empieza con `AIzaSy...`)

### 5. (Opcional) Restringir la API Key (recomendado)
- En "Application restrictions":
  - Selecciona: **IP addresses**
  - Agrega las IPs de Vercel (o deja en blanco para desarrollo)
- En "API restrictions":
  - Selecciona: **Restrict key**
  - Busca y selecciona: **Calendar API**
- Haz clic en **Save**

---

## Configurar en Vercel

### Opción 1: Via Dashboard (Web)

1. Ve a: https://vercel.com/dashboard
2. Abre el proyecto: `whatsapp-clinica-dental`
3. Ve a: **Settings** → **Environment Variables**
4. Agrega:
   ```
   GOOGLE_CALENDAR_API_KEY=tu_api_key_aqui (la que empieza con AIzaSy)
   ```
5. Haz clic en **Save**
6. Ve a: **Deployments** → Redeploy

### Opción 2: Via CLI

```bash
npx vercel env set GOOGLE_CALENDAR_API_KEY production
# Pega tu API Key cuando te lo pida
# Presiona Enter

npx vercel --prod
```

---

## Verificar

Después de desplegar, puedes probar el bot:

1. Envia: "quiero una limpieza"
2. Verifica que se cree la cita en Google Calendar
3. Deberías ver el evento en tu calendario: https://calendar.google.com

---

## Variables de Entorno Completes

En `.env.local` y Vercel deberías tener:

```bash
# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_WEBHOOK_URL=...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://zzaetaljaxxuvbgnfdvc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Cal.com
CAL_API_KEY=...
CAL_EVENT_TYPE_LIMPIEZA=...
# ... otros CAL_EVENT_TYPE_*

# Cron Job Security
CRON_SECRET=...

# Google Calendar (NUEVO)
GOOGLE_CALENDAR_ID=sain.ornelas@uabc.edu.mx
GOOGLE_CALENDAR_API_KEY=AIzaSy... (la API Key real)
```
