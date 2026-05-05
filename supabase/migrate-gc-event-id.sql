-- Migración para agregar referencia a Google Calendar
-- GAP 1+2: Cancelación y Reagendamiento Automáticos con Google Calendar API

-- Agregar referencia a evento de Google Calendar
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS gc_event_id TEXT;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_appointments_gc_event_id
ON appointments(gc_event_id);

-- Opcional: Migrar citas existentes de Cal.com
-- Esto permite que citas creadas con Cal.com también puedan ser canceladas/reagendadas
-- Solo se aplica si el campo cal_booking_uid tiene el formato de eventId de Google Calendar
-- UPDATE appointments
-- SET gc_event_id = cal_booking_uid
-- WHERE cal_booking_uid IS NOT NULL
--   AND gc_event_id IS NULL
--   AND LENGTH(cal_booking_uid) = 26; -- Google Calendar event IDs tienen 26 caracteres
