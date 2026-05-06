# Instrucciones para configurar cron-job.org

## Tu API Token:
`chGFZUBFGspCTKR25luroB01pm/CDDC9LMC6cqGpcPw=`

---

## Paso 1: Crear el Cron Job

### Opción A: Interfaz Web (Más fácil)

1. Ve a: https://cron-job.org/login
2. Inicia sesión con tu cuenta
3. Ve a: https://cron-job.org/cronjobs
4. Haz clic en "Create cronjob"

5. Llena los campos:
   - **Title:** `WhatsApp Dental - Recordatorio 1h`
   - **Description:** `Envía recordatorio 1 hora antes de cada cita dental`
   - **URL:** `https://whatsapp-clinica-dental.vercel.app/api/cron/reminders-1h`
   - **Method:** `GET`
   - **Save Responses:** `Yes` (para ver los logs)
   - **Timeout:** `30 seconds`

6. En la sección "Schedule":
   - Selecciona: "Every X minutes/hours/days/weeks/months"
   - Elige: "Hour"
   - Value: `1` (cada 1 hora)

7. En la sección "HTTP Headers" (puede estar en "Advanced"):
   - Agrega un header:
     - **Name:** `Authorization`
     - **Value:** `Bearer tu_CRON_SECRET`
   - **Importante:** Reemplaza `tu_CRON_SECRET` con el valor de tu variable `CRON_SECRET` del archivo `.env.local`

8. Haz clic en "Save"

---

### Opción B: Usando la API (Automático)

Usa tu API Token para crear el job vía API:

```bash
curl -X POST "https://api.cron-job.org/jobs" \
  -H "Authorization: Bearer chGFZUBFGspCTKR25luroB01pm/CDDC9LMC6cqGpcPw=" \
  -H "Content-Type: application/json" \
  -d '{
    "job": {
      "title": "WhatsApp Dental - Recordatorio 1h",
      "url": "https://whatsapp-clinica-dental.vercel.app/api/cron/reminders-1h",
      "saveResponses": true,
      "enabled": true,
      "executionDetails": {
        "method": "GET",
        "httpHeaders": [
          {
            "name": "Authorization",
            "value": "Bearer tu_CRON_SECRET"
          }
        ]
      },
      "schedule": {
        "type": "cron-expression",
        "expression": "0 * * * *"
      }
    }
  }'
```

---

## Paso 2: Verificar tu CRON_SECRET

Necesitas el valor de tu variable `CRON_SECRET` para el header.

**Para verlo:**

1. Abre el archivo: `.env.local` en tu proyecto
2. Busca la línea: `CRON_SECRET=...`
3. Copia el valor después del `=`

**Ejemplo:**
```
CRON_SECRET=3ee1ea6acb29bf6d7b978a8a2b494144d361bcf27b5e34632defb5e1bb9a2a23
```

El header sería: `Authorization: Bearer 3ee1ea6acb29bf6d7b978a8a2b494144d361bcf27b5e34632defb5e1bb9a2a23`

---

## Paso 3: Probar el Cron Job

Después de crearlo:

1. Ve a: https://cron-job.org/cronjobs
2. Busca tu job: "WhatsApp Dental - Recordatorio 1h"
3. Haz clic en "Run now" (o icono de play)
4. Ve a "Execution log" para ver el resultado

Deberías ver algo como:
```
Status: 200 OK
Response: {"success":true,"message":"1h Reminders sent: 0, Failed: 0","note":"..."}
```

Si dice `No 1h reminders to send`, es normal si no hay citas en la ventana de 1 hora.

---

## Paso 4: Verificar que funcione

Para probar que realmente envíe recordatorios:

1. Crea una cita de prueba para dentro de 1 hora (por ejemplo, a las 3:30 PM siendo las 2:30 PM)
2. Espera a que el cron job se ejecute (a la hora siguiente)
3. Deberías recibir el WhatsApp de recordatorio

---

## ¿Cómo saber si funcionó?

En la interfaz de cron-job.org:
- Ve al "Execution log" de tu job
- Verás cada ejecución con:
  - Fecha y hora
  - Status (200 OK = éxito)
  - Response body
  - Duration

---

## Troubleshooting

### Error 401 Unauthorized
- Verifica que el header `Authorization` esté correcto
- El formato debe ser: `Bearer tu_CRON_SECRET`

### Error 500 Internal Server Error
- Verifica que la URL sea correcta: `https://whatsapp-clinica-dental.vercel.app/api/cron/reminders-1h`
- Revisa los logs de Vercel para más detalles

### No envía recordatorios
- Es normal si no hay citas en la ventana de 58-62 minutos
- Crea una cita de prueba en esa ventana
- Verifica el "Execution log" en cron-job.org

---

## Cron Expression Explicada

`0 * * * *` significa:
- `0` = En el minuto 0 (al inicio de la hora)
- `*` = Cada hora
- `*` = Cada día del mes
- `*` = Cada mes
- `*` = Cada día de la semana

Ejecución: 1:00, 2:00, 3:00, 4:00, etc. (cada hora en punto)
