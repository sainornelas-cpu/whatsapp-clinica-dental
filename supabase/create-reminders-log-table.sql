-- SOLUCIÓN ALTERNATIVA: Crear tabla separada para rastrear recordatorios
-- Esto NO requiere modificar la tabla appointments existente

-- Crear tabla para rastrear recordatorios enviados
CREATE TABLE IF NOT EXISTS reminders_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  reminder_type TEXT NOT NULL, -- '24h' o '1h'
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_reminders_log_appointment_id ON reminders_log(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reminders_log_type ON reminders_log(reminder_type);
CREATE INDEX IF NOT EXISTS idx_reminders_log_sent_at ON reminders_log(sent_at);

-- Habilitar RLS
ALTER TABLE reminders_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Service role full access to reminders_log" ON reminders_log FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Authenticated users can read reminders_log" ON reminders_log FOR SELECT USING (auth.role() = 'authenticated');

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE reminders_log;

-- Verificación
SELECT 'Tabla reminders_log creada exitosamente' as status;
