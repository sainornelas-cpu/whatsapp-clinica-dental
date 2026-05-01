-- GAP 5: Agregar SOLO la columna reminder_1h_sent
-- Este script NO elimina nada, solo agrega la columna necesaria

-- Paso 1: Verificar si la columna ya existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'reminder_1h_sent'
  ) THEN
    RAISE NOTICE 'La columna reminder_1h_sent ya existe';
  ELSE
    -- Agregar la columna
    ALTER TABLE appointments ADD COLUMN reminder_1h_sent BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Columna reminder_1h_sent agregada exitosamente';
  END IF;
END $$;

-- Paso 2: Verificar el resultado
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'appointments' AND column_name = 'reminder_1h_sent';
