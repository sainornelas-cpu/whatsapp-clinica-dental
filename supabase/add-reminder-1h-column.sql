-- GAP 5: Agregar columna para rastrear recordatorios de 1 hora antes
-- Ejecutar este script en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/zzaetaljaxxuvbgnfdvc/sql

-- Agregar columna reminder_1h_sent a la tabla appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT FALSE;

-- Crear índice para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_1h
ON appointments (reminder_1h_sent)
WHERE reminder_1h_sent = false;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
  AND column_name = 'reminder_1h_sent';
