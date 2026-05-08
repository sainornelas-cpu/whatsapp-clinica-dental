# Configurar Webhook de Cal.com para Confirmación de Citas

## Problema Actual
Las citas se quedan en estado "pending" porque el webhook de Cal.com no está actualizando las citas en Supabase.

## Solución: Configurar el Webhook en Cal.com

### Paso 1: Ir a la Configuración de Webhooks

1. Inicia sesión en [https://app.cal.com](https://app.cal.com)
2. Ve a **Settings** (engranaje en la esquina superior derecha)
3. En el menú lateral, selecciona **Advanced**
4. Haz clic en **Webhooks**
5. Haz clic en **Create New Webhook**

### Paso 2: Configurar el Webhook

Llena los campos con la siguiente información:

| Campo | Valor |
|-------|-------|
| **Webhook URL** | `https://whatsapp-clinica-dental.vercel.app/api/cal-webhook` |
| **Secret / API Key** | `cal_live_2c489b896dac04235041326d05cbf74b` |
| **Events** | Selecciona los siguientes eventos: |
| | ✅ `BOOKING_CREATED` |
| | ✅ `BOOKING_CANCELLED` |
| | ✅ `BOOKING_RE_SCHEDULED` |

### Paso 3: Guardar y Probar

1. Haz clic en **Save** o **Create**
2. Haz clic en **Send test event** para verificar que funciona
3. Deberías ver una respuesta `200 OK`

### Paso 4: Verificar el Formato del Header

Cal.com debe enviar el header de autenticación de esta manera:
```
Authorization: Bearer cal_live_2c489b896dac04235041326d05cbf74b
```

## Verificar que Funciona

### Método 1: Prueba Manual

1. Agenda una cita usando el bot de WhatsApp
2. Completa la reserva en Cal.com
3. Espera unos segundos
4. Pide "mis citas" al bot
5. La cita debería mostrarse como **"confirmada"** (no "pendiente de confirmación")

### Método 2: Revisar Logs en Vercel

1. Ve a [https://vercel.com/sainornelas-5924s-projects/whatsapp-clinica-dental](https://vercel.com/sainornelas-5924s-projects/whatsapp-clinica-dental)
2. Selecciona el deployment más reciente
3. Haz clic en **Logs**
4. Agenda una cita en Cal.com
5. Busca logs que digan "Cal.com webhook POST - Event received"

## Si el Webhook no Funciona

### Problema 1: Error de Autenticación

Si ves en los logs: "Unauthorized Cal.com webhook attempt"

**Solución:** Verifica que la API Key en Cal.com sea exactamente:
```
cal_live_2c489b896dac04235041326d05cbf74b
```

### Problema 2: Webhook no Recibe Eventos

**Solución:**
1. Asegúrate de haber seleccionado los 3 eventos: BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RE_SCHEDULED
2. Verifica que la URL sea: `https://whatsapp-clinica-dental.vercel.app/api/cal-webhook`

### Problema 3: Webhook Recibe pero No Actualiza

**Solución:** Revisa los logs de Vercel para ver el error específico. Posibles causas:
- Error de conexión con Supabase
- El booking no coincide con ninguna cita pendiente
- Error en el formato del payload

## URL del Webhook

```
https://whatsapp-clinica-dental.vercel.app/api/cal-webhook
```

## API Key

```
cal_live_2c489b896dac04235041326d05cbf74b
```
