# CHECKLIST DE GAPS DEL SISTEMA - SOLUCIONES

**Fecha:** 1 de mayo de 2026
**Estado actual:** 6 gaps identificados, 2 ya implementados

---

## RESUMEN EJECUTIVO

| Gap | Estado | Solución Recomendada | Costo | Tiempo | Prioridad |
|-----|--------|---------------------|-------|--------|-----------|
| 1. Cancelación automática | ❌ Manual | Easy!Appointments | $0 | 4-6h | ALTA |
| 2. Reagendamiento automático | ❌ Manual | Easy!Appointments | $0 | 2-3h | ALTA |
| 3. Memoria del bot | ✅ Implementado | Verificar | $0 | 1-2h | MEDIA |
| 4. Recordatorio 24h antes | ✅ Implementado | Verificar | $0 | 30min | BAJA |
| 5. Recordatorio 1h antes | ✅ Listo (configurar cron) | cron-job.org | $0 | 10min | MEDIA |
| 6. Calendario para dentista | ❌ NO | React Big Calendar | $0 | 4-6h | MEDIA |
| 7. Analytics con data real | ⚠️ Verificar | Verificar conexión | $0 | 1h | BAJA |

---

## GAP 1: EL SISTEMA NO CANCELA AUTOMÁTICAMENTE

### Estado Actual
- **Implementación:** Usa links de Cal.com para cancelación MANUAL
- **Problema:** El paciente debe entrar a Cal.com para cancelar
- **Usuario siente:** "El bot no cancela por mí"

### Causa Raíz
- Cal.com API v1 está desactivada (410 Gone)
- Cal.com API v2 requiere configuración compleja que falló en pruebas
- Links de Cal.com son la única solución funcional actual

### Soluciones Investigadas

#### Opción A: Easy!Appointments (RECOMENDADA - GRATIS)
- **URL:** https://easyappointments.org/
- **API:** https://easyappointments.org/documentation/rest-api/
- **Costo:** 100% GRATIS (Open Source MIT)
- **Ventajas:**
  - API REST completa y documentada
  - Swagger UI para testing
  - Cancelación programática simple: `DELETE /api/v1/appointments/{id}`
  - Self-hosted (control total)
- **Desventajas:**
  - Requiere hosting propio (Vercel, Railway, Heroku)
  - Interfaz menos moderna

**Implementación:**
```bash
# 1. Instalar Easy!Appointments
git clone https://github.com/alextselegidis/easyappointments.git
# Configurar en Vercel/Railway
```

```typescript
// lib/easy-appointments.ts
const EA_API_URL = process.env.EA_API_URL;
const EA_API_KEY = process.env.EA_API_KEY;

export async function cancelAppointment(appointmentId: string) {
  const response = await fetch(`${EA_API_URL}/api/v1/appointments/${appointmentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${EA_API_KEY}` },
  });
  return response.ok;
}
```

#### Opción B: Nylas Scheduler ($99/mes)
- **URL:** https://developer.nylas.com/docs/v3/scheduler/
- **Costo:** Desde $99/mes
- **Ventajas:** API potente, componentes UI incluidos
- **Desventajas:** Costo mensual, configuración compleja

#### Opción C: Calendly Scheduling API ($12/mes)
- **URL:** https://developer.calendly.com/
- **Costo:** Desde $12/mes
- **Ventajas:** API nueva, bien documentada
- **Desventajas:** Requiere plan pago, menos potente que Nylas

### Plan de Implementación (Easy!Appointments)

**Paso 1:** Desplegar Easy!Appointments (30 min)
- Clonar repositorio
- Configurar base de datos
- Desplegar en Vercel/Railway

**Paso 2:** Crear integración en el proyecto (2 horas)
```typescript
// Crear: lib/easy-appointments.ts
export async function createAppointment(data: AppointmentData)
export async function cancelAppointment(id: string)
export async function rescheduleAppointment(id: string, newDate: string)
```

**Paso 3:** Modificar webhook del bot (2 horas)
```typescript
// app/api/webhook/route.ts
// Actualizar funciones bookAppointment, cancelAppointment, rescheduleAppointment
```

**Paso 4:** Migrar datos de Cal.com a Easy!Appointments (1 hora)

**Paso 5:** Pruebas y ajustes (30 min)

**Costo Total:** $0 (solo tiempo de desarrollo)
**Tiempo Estimado:** 4-6 horas
**Prioridad:** ALTA

---

## GAP 2: EL SISTEMA NO PERMITE REAGENDAR

### Estado Actual
- **Implementación:** Usa links de Cal.com para reagendamiento MANUAL
- **Problema:** Similar a GAP 1

### Solución
- **Misma que GAP 1:** Migrar a Easy!Appointments
- **API Endpoint:** `PUT /api/v1/appointments/{id}`

### Plan de Implementación
- Ya incluido en GAP 1
- Tiempo adicional: 2-3 horas
- Costo: $0

**Prioridad:** ALTA

---

## GAP 3: EL SISTEMA NO TIENE MEMORIA

### Estado Actual
- **Implementación:** ✅ YA IMPLEMENTADO
- **Código:** `app/api/webhook/route.ts` líneas 130-150
- **Funcionalidad:**
  - Guarda historial de conversaciones en Supabase
  - Carga los últimos 10 mensajes como contexto
  - Usa el número de teléfono como identificador

### Por qué puede parecer que no funciona

1. **El contexto puede ser limitado** (solo 10 mensajes)
2. **El usuario puede no percibir que el bot recuerda**
3. **Puede haber errores en la carga del contexto**

### Plan de Verificación y Mejora

**Paso 1:** Verificar que el historial se guarde correctamente (15 min)
```sql
-- Ejecutar en Supabase SQL Editor
SELECT * FROM messages ORDER BY created_at DESC LIMIT 20;
```

**Paso 2:** Aumentar el límite de contexto si es necesario (5 min)
```typescript
// app/api/webhook/route.ts línea 176
const history = await loadConversationHistory(conversation.id, 20); // De 10 a 20
```

**Paso 3:** Agregar respuesta que demuestre memoria (30 min)
```typescript
// En AGENT_PROMPT.md, agregar:
# USAR INFORMACIÓN PREVIA
Cuando el paciente mencione algo de la conversación previa,
referencia esa información explícitamente para demostrar que recuerdas.

Ejemplo: "Como mencionaste antes, prefieres las citas por la mañana..."
```

**Paso 4:** Pruebas (15 min)

**Costo:** $0
**Tiempo Estimado:** 1-2 horas
**Prioridad:** MEDIA

---

## GAP 4: EL SISTEMA NO NOTIFICA 1 DÍA ANTES

### Estado Actual
- **Implementación:** ✅ YA IMPLEMENTADO
- **Código:** `app/api/cron/reminders/route.ts`
- **Configuración:** `vercel.json` - Ejecuta a las 10:00 AM UTC diario
- **Funcionalidad:**
  - Busca citas 20-28 horas en el futuro
  - Envía recordatorio por WhatsApp
  - Marca `reminder_sent: true`

### Plan de Verificación

**Paso 1:** Verificar configuración en Vercel (10 min)
- Ir a Settings → Cron Jobs
- Confirmar que `/api/cron/reminders` esté configurado

**Paso 2:** Verificar ejecución (10 min)
```sql
-- Verificar que reminder_sent se esté marcando
SELECT * FROM appointments WHERE reminder_sent = true ORDER BY created_at DESC LIMIT 5;
```

**Paso 3:** Probar manualmente (10 min)
```bash
curl -X GET "https://whatsapp-clinica-dental.vercel.app/api/cron/reminders" \
  -H "Authorization: Bearer tu_CRON_SECRET"
```

**Costo:** $0
**Tiempo Estimado:** 30 minutos
**Prioridad:** BAJA (verificación)

---

## GAP 5: EL SISTEMA NO NOTIFICA 1 HORA ANTES

### Estado Actual
- **Implementación:** ✅ COMPLETADO (sin migración de BD)
- **Endpoint creado:** `app/api/cron/reminders-1h/route.ts`
- **Solución:** Usa ventana de tiempo estrecha (58-62 min) - NO requiere modificar BD
- **Pendiente:** Configurar cron-job.org
- **Limitación:** Vercel solo permite 1 cron job por proyecto (por eso usamos cron-job.org)

### Solución Final: Sin Migración de Base de Datos

Debido a problemas de permisos en Supabase ("must be owner", "permission denied"), implementamos una solución que **NO requiere ninguna modificación de la base de datos**:

**Cómo funciona:**
1. El cron job se ejecuta cada hora (via cron-job.org)
2. Busca citas en una ventana muy estrecha: 58-62 minutos en el futuro
3. Envía el recordatorio por WhatsApp
4. **NO marca nada en la base de datos**
5. La ventana de 4 minutos evita duplicados dado que el job se ejecuta solo una vez por hora

**Ventajas:**
- ✅ NO requiere permisos de owner
- ✅ NO requiere migración de base de datos
- ✅ Funciona inmediatamente
- ✅ Fácil de entender y mantener

**Desventajas:**
- ⚠️ Si el cron job falla en una hora, esa ventana de citas no recibirán recordatorio
- ⚠️ Menos preciso que marcar en BD (pero funcional)

### Plan de Implementación (cron-job.org) - ACTUALIZADO

**Paso 1:** ✅ COMPLETADO - Crear endpoint de recordatorio 1h
- Archivo: `app/api/cron/reminders-1h/route.ts`
- Busca citas 58-62 minutos en el futuro
- Envía recordatorio por WhatsApp
- **NO modifica la base de datos**

**Paso 2:** ⏳ PENDIENTE - Configurar cron-job.org (10 min)
- Registrarse en https://cron-job.org
- Crear job:
  - **Title:** WhatsApp Dental - Recordatorio 1h
  - **Schedule:** `0 * * * *` (cada hora)
  - **URL:** `https://whatsapp-clinica-dental.vercel.app/api/cron/reminders-1h`
  - **Method:** GET
  - **Headers:** Agregar `Authorization: Bearer tu_CRON_SECRET`

**Paso 3:** ⏳ PENDIENTE - Probar (5 min)
- Crear una cita de prueba
- Verificar que llegue el recordatorio 1h antes

**Costo:** $0
**Tiempo Estimado:** 1-2 horas
**Prioridad:** MEDIA

---

## GAP 6: EL SISTEMA NO TIENE CALENDARIO PARA EL DENTISTA

### Estado Actual
- **Implementación:** ❌ NO IMPLEMENTADO
- **Dashboard actual:** Muestra listas de citas pero NO calendario visual

### Soluciones Investigadas

#### Opción A: React Big Calendar (RECOMENDADA - GRATIS)
- **URL:** https://github.com/jquense/react-big-calendar
- **Costo:** 100% GRATIS (MIT License)
- **Ventajas:**
  - Comunidad grande (175K+ descargas semanales)
  - Vistas: día, semana, mes, agenda
  - Drag & drop
  - Fácil integración con Supabase
- **Desventajas:**
  - Interfaz básica
  - Requiere más personalización

#### Opción B: FullCalendar ($79/año)
- **URL:** https://fullcalendar.io/
- **Costo:** $79/año (Standard) o $149/año (Premium)
- **Ventajas:**
  - Profesional, muy usado
  - Excelente documentación
  - Resource scheduling
- **Desventajas:**
  - Costo anual

#### Opción C: DHTMLX Scheduler ($299+)
- **URL:** https://dhtmlx.com/docs/products/dhtmlxScheduler-for-React/
- **Costo:** Desde $299 (one-time)
- **Ventajas:** Template médico dedicado
- **Desventajas:** Costo alto

### Plan de Implementación (React Big Calendar)

**Paso 1:** Instalar dependencias (5 min)
```bash
npm install react-big-calendar moment
```

**Paso 2:** Crear página de calendario (2 horas)
```typescript
// Crear: app/dashboard/calendar/page.tsx
// Ver código completo en investigación de calendarios
```

**Paso 3:** Agregar navegación en sidebar (10 min)
```typescript
// components/DashboardSidebar.tsx
const navItems = [
  { path: '/dashboard/calendar', label: 'Calendario', icon: '📅' },
  // ...
];
```

**Paso 4:** Agregar creación/edición de citas (1-2 horas)
- Modal para crear cita
- Modal para ver/editar cita
- Integración con Supabase

**Paso 5:** Pruebas y ajustes (30 min)

**Costo:** $0
**Tiempo Estimado:** 4-6 horas
**Prioridad:** MEDIA

---

## GAP 7: DASHBOARD DE ANÁLISIS CON DATA REAL

### Estado Actual
- **Implementación:** ⚠️ Debería tener data real
- **Código:** `app/dashboard/analytics/page.tsx`
- **Problema:** Puede no estar conectando correctamente a Supabase

### Plan de Verificación

**Paso 1:** Verificar conexión a Supabase (10 min)
- Ir a `/diagnose`
- Verificar que "Prueba de Conexión a Supabase" sea exitosa

**Paso 2:** Verificar políticas RLS (10 min)
```sql
-- Ejecutar en Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename IN ('patients', 'appointments', 'conversations', 'messages');
```

**Paso 3:** Verificar que haya datos en la base de datos (5 min)
```sql
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM appointments;
SELECT COUNT(*) FROM conversations;
SELECT COUNT(*) FROM messages;
```

**Paso 4:** Si no hay datos o hay errores, ejecutar script de RLS (10 min)
- Usar SQL de `supabase/fix-rls.sql`

**Costo:** $0
**Tiempo Estimado:** 1 hora
**Prioridad:** BAJA

---

## MATRIZ DE DECISIÓN

### ¿Cuáles son ALCANZABLES AHORA?

| Gap | ¿Alcanzable? | ¿Por qué? |
|-----|--------------|-----------|
| 1. Cancelación automática | ✅ SÍ | Easy!Appointments es gratis y tiene API completa |
| 2. Reagendamiento automático | ✅ SÍ | Mismo que GAP 1 |
| 3. Memoria del bot | ✅ SÍ | Ya implementado, solo verificar |
| 4. Recordatorio 24h | ✅ SÍ | Ya implementado, solo verificar |
| 5. Recordatorio 1h | ✅ SÍ | cron-job.org es gratis |
| 6. Calendario dentista | ✅ SÍ | React Big Calendar es gratis |
| 7. Analytics real | ✅ SÍ | Solo verificar conexión |

**CONCLUSIÓN:** TODOS LOS GAPS SON ALCANZABLES CON LAS HERRAMIENTAS ACTUALES.

---

## ROADMAP DE IMPLEMENTACIÓN

### FASE 1: VERIFICAR LO EXISTENTE (2 horas)
- [ ] Verificar memoria del bot (GAP 3)
- [ ] Verificar recordatorio 24h (GAP 4)
- [ ] Verificar analytics real (GAP 7)

### FASE 2: SOLUCIONES RÁPIDAS (2 horas)
- [ ] Implementar recordatorio 1h (GAP 5)
- [ ] Verificar/Configurar RLS en Supabase

### FASE 3: CALENDARIO PARA DENTISTA (4-6 horas)
- [ ] Instalar React Big Calendar
- [ ] Crear página de calendario
- [ ] Agregar navegación
- [ ] Implementar creación/edición de citas

### FASE 4: MIGRAR SISTEMA DE RESERVAS (6-9 horas)
- [ ] Desplegar Easy!Appointments
- [ ] Crear integración
- [ ] Modificar webhook del bot
- [ ] Migrar datos
- [ ] Pruebas

**TIEMPO TOTAL:** 14-19 horas de desarrollo
**COSTO TOTAL:** $0 (solo tiempo)

---

## RECURSOS Y FUENTES

### Easy!Appointments
- Documentación API: https://easyappointments.org/documentation/rest-api/
- GitHub: https://github.com/alextselegidis/easyappointments
- Swagger UI: https://developers.easyappointments.org/api/

### React Big Calendar
- GitHub: https://github.com/jquense/react-big-calendar
- Demo: https://jquense.github.io/react-big-calendar/examples/index.html

### cron-job.org
- API Docs: https://docs.cron-job.org/rest-api.html

### Vercel Cron Jobs
- Docs: https://vercel.com/docs/cron-jobs

---

## PRÓXIMOS PASOS

1. **Revisar este checklist con el usuario** para confirmar prioridades
2. **Comenzar con FASE 1** (verificar lo existente)
3. **Proceder según prioridades del usuario**
