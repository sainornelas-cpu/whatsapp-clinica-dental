-- GAP 5: Agregar columna para rastrear recordatorios de 1 hora antes
-- Ejecutar este script en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/zzaetaljaxxuvbgnfdvc/sql

-- Solo agregar la columna - el índice es opcional
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT FALSE;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
  AND column_name = 'reminder_1h_sent';
