# 📦 RESPALDO - CONFIGURACIÓN FUNCIONAL v90%
**Fecha:** 8 de mayo de 2026
**Estado:** 🟢 FUNCIONAL (90%)
**Branch:** `backup/working-v90-may2026`

---

## ✅ LO QUE FUNCIONA

### WhatsApp Bot
- ✅ Recibe y procesa mensajes de WhatsApp
- ✅ Responde con opciones numeradas (1, 2, 3...)
- ✅ Genera links de Cal.com para reservas
- ✅ Guarda historial de conversaciones
- ✅ Saluda por nombre (después de que el paciente reserva)
- ✅ Muestra citas programadas
- ✅ Proporciona links para cancelar/reagendar

### Sistema de Reservas
- ✅ Links de Cal.com funcionando para 6 servicios
- ✅ Webhook de Cal.com recibe confirmaciones
- ✅ Citas se guardan en Supabase (pending → scheduled)
- ✅ Confirmación automática por WhatsApp al completar reserva

### Recordatorios
- ✅ Cron job 24h: `/api/cron/reminders` (Vercel)
- ✅ Cron job 1h: `/api/cron/reminders-1h` (cron-job.org)
- ✅ Mensajes de recordatorio con nombre del paciente

### Base de Datos
- ✅ Supabase configurado correctamente
- ✅ SERVICE ROLE KEY funcionando
- ✅ RLS policies activas
- ✅ Índices en `cal_booking_uid`
- ✅ Pacientes, citas, conversaciones y mensajes guardados

### Dashboard
- ✅ Login funcional (sain.ornelas@uabc.edu.mx / Dental2026!)
- ✅ Ver conversaciones
- ✅ Ver pacientes
- ✅ Ver citas

---

## 🔧 CONFIGURACIÓN CRÍTICA

### Variables de Entorno (REQUERIDAS)
Ver archivo `.env.local` local para los valores completos.

**Variables necesarias:**
- `WHATSAPP_ACCESS_TOKEN` - Token de WhatsApp Cloud API
- `WHATSAPP_PHONE_NUMBER_ID` - ID del número de WhatsApp
- `WHATSAPP_VERIFY_TOKEN` - Token de verificación del webhook
- `NEXT_PUBLIC_SUPABASE_URL` - URL de Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - ANON key de Supabase
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` - SERVICE ROLE key de Supabase (CRÍTICO)
- `CAL_API_KEY` - API key de Cal.com
- `CRON_SECRET` - Secreto para proteger cron jobs
- `OPENAI_API_KEY` - API key de OpenAI

### Links de Cal.com (CONFIRMADOS)
```
Limpieza: https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/limpieza-dental-profesional
Consulta: https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/consulta-general
Blanqueamiento: https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/blanqueamiento-dental
Ortodoncia: https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/ortodoncia
Extracción: https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/extraccion-dental
Urgencia: https://cal.com/alfredo-sain-ornelas-almeida-e6i0wr/atencion-de-urgencia
```

### Webhook URLs
- **WhatsApp:** `https://whatsapp-clinica-dental.vercel.app/api/webhook`
- **Cal.com:** `https://whatsapp-clinica-dental.vercel.app/api/cal-webhook`
- **Reminders 24h:** `https://whatsapp-clinica-dental.vercel.app/api/cron/reminders`
- **Reminders 1h:** `https://whatsapp-clinica-dental.vercel.app/api/cron/reminders-1h`

---

## 📁 ARCHIVOS CLAVE (ESTADO FUNCIONAL)

```
app/api/webhook/route.ts          - Lógica principal del bot ✅
app/api/cal-webhook/route.ts      - Webhook de Cal.com ✅
app/api/cron/reminders/route.ts   - Recordatorios 24h ✅
app/api/cron/reminders-1h/route.ts - Recordatorios 1h ✅
lib/cal-links.ts                  - Links de booking ✅
lib/supabase.ts                   - Cliente Supabase ✅
AGENT_PROMPT.md                   - Prompt del bot ✅
```

---

## 🎯 FLUJO DE USO CONFIRMADO

1. Usuario escribe al WhatsApp bot
2. Bot responde con opciones numeradas
3. Usuario selecciona servicio o escribe lo que necesita
4. Bot genera link de Cal.com
5. Usuario completa reserva en Cal.com
6. Cal.com envía webhook al sistema
7. Sistema actualiza estado de cita
8. Sistema envía confirmación por WhatsApp
9. Sistema envía recordatorio 24h antes
10. Sistema envía recordatorio 1h antes

---

## ⚠️ LIMITACIONES CONOCIDAS (10% restante)

1. **Nombre del paciente:** Solo se guarda después de completar reserva en Cal.com
2. **Calendario del dentista:** Implementado en dashboard pero no completamente integrado
3. **Análisis:** La página de analytics tiene errores de TypeScript (no afecta funcionamiento)
4. **Validación:** No hay validación de formato de teléfono/email en el bot

---

## 🔄 CÓMO RESTAURAR

```bash
# Ver lista de branches
git branch -a

# Cambiar al branch de respaldo
git checkout backup/working-v90-may2026

# Si necesitas crear un nuevo branch desde el respaldo
git checkout -b nuevo-branch backup/working-v90-may2026

# Volver al desarrollo
git checkout main
```

---

## 📝 ÚLTIMO COMMIT DEL RESPALDO

```
Commit: 4fa0f26
Mensaje: chore: add calendar dependencies
Fecha: 8 de mayo de 2026
```

---

## 🚀 URLS DE PRODUCCIÓN

- **App:** https://whatsapp-clinica-dental.vercel.app
- **Dashboard:** https://whatsapp-clinica-dental.vercel.app/dashboard
- **Login:** https://whatsapp-clinica-dental.vercel.app/login

---

**Este respaldo representa la configuración estable y funcional del sistema.**
**Cualquier cambio futuro debe partir de este estado conocido.**

---

## 📋 CHECKLIST DE VERIFICACIÓN ANTES DE CAMBIOS

Antes de hacer cambios al main, verificar:
- [ ] Servicio ROLE KEY es correcta
- [ ] Webhook de Cal.com está configurado
- [ ] Cron jobs están activos
- [ ] El bot responde en WhatsApp
- [ ] Las reservas se completan en Cal.com
- [ ] Los recordatorios se envían
