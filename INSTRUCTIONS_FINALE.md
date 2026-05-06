# Instrucciones Finales - GAP 1+2: Google Calendar API

## ✅ IMPLEMENTACIÓN COMPLETADA

### Resumen de Cambios
| Archivo | Estado |
|--------|--------|
| `lib/google-calendar.ts` | ✅ | Integración Google Calendar con OAuth (autenticación simple) |
| `app/api/webhook/route.ts` | ✅ | Funciones del bot actualizadas |
| `AGENT_PROMPT.md` | ✅ | Actualizado - Flujo sin referencias a Cal.com |
| `supabase/migrate-gc-event-id.sql` | ✅ | Migración SQL para gc_event_id |
| `package.json` | ✅ | Dependencia googleapis agregada |

---

## 🎯 ENFOQUE FINAL

**Google Calendar API con autenticación simple (API Key)**
- ✅ Más simple que OAuth 2.0
- ✅ No requiere autorización del dentista
- ✅ El bot crea citas en el calendario del bot
- ✅ El dentista puede ver/editar las citas

**Cómo funciona ahora:**
1. Bot crea eventos en Google Calendar (tu calendario principal)
2. Las citas se guardan en Supabase con el evento ID
3. El dentista ve las citas en su Google Calendar (tú@sain.ornelas@uabc.edu.mx)
4. Cancelación y reagendamiento automáticos via bot

---

## 📋 Pasos para que el DENTISTA ACTIVE

### 1. Obtener Google Calendar API Key (5 min)
1. Ve a: https://console.cloud.google.com/
2. Ve a: APIs & Services → Credentials
3. Crea: "API Key"
4. Nombre: `WhatsApp Dental Bot`
5. Habilitar: "Google Calendar API"
6. Copia la API Key
7. Guarda el archivo JSON en la raíz del proyecto (NO subir a GitHub)

---

### 2. Configurar Variables de Entorno en Vercel (3 min)
1. Ve a: https://vercel.com/dashboard
2. Abre: `whatsapp-clinica-dental`
3. Settings → Environment Variables
4. Agrega:

```bash
GOOGLE_CALENDAR_API_KEY=tu_api_key_aqui
```

5. Haz clic en "Save"

---

### 3. Ejecutar Migración SQL en Supabase (3 min)
1. Ve a: https://zzaetaljaxxuvbgnfdvc.supabase.co/project/settings/sql
2. Abre: supabase/migrate-gc-event-id.sql
3. Ejecuta y confirma

---

### 4. Probar el Bot (5 min)
1. Envia: "quiero una limpieza" al bot
2. Verifica que se cree la cita en Google Calendar
3. Prueba "cancelar"
4. Prueba "reagendar"

---

## 🔧 Cómo Funciona el Sistema Ahora

### Crear Cita
```
Usuario → WhatsApp → Bot crea evento en Google Calendar → Confirmación
```

### Ver Citas
```
Usuario → WhatsApp → Bot consulta Supabase → Lista de citas
```

### Cancelar Cita
```
Usuario → "cancelar" → Bot busca cita → Cancela en Google Calendar → Confirmación
```

### Reagendar Cita
```
Usuario → "reagendar" → Bot muestra horarios → Usuario selecciona → Bot reagenda en Google Calendar → Confirmación
```

---

## 📂 Archivos de Referencia

- `lib/google-calendar.ts` - Integración Google Calendar
- `app/api/webhook/route.ts` - Webhook del bot
- `AGENT_PROMPT.md` - Prompt del bot actualizado
- `supabase/migrate-gc-event-id.sql` - Migración SQL

---

## ⚠️ IMPORTANTE - SOLO FALTA LA API KEY

Una vez que tengas la `GOOGLE_CALENDAR_API_KEY`, agrega la variable a Vercel:
```bash
GOOGLE_CALENDAR_API_KEY=tu_api_key_aqui
```

---

## 🚀 Verificación de Deployment

El código está listo. Vercel deployará automáticamente.

URL del proyecto: https://whatsapp-clinica-dental.vercel.app/

---

**¿Necesitas ayuda con los pasos para obtener la API Key?**
