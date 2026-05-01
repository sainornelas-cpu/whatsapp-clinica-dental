'use client';

import { useEffect, useState } from 'react';

export default function MigrateReminder1hPage() {
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTable();
  }, []);

  const checkTable = async () => {
    try {
      const res = await fetch('/api/migrate/check-reminders-log');
      const data = await res.json();
      setTableExists(data.exists);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Verificando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Migración: Recordatorio 1 Hora</h1>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <p className="text-blue-400 text-sm font-medium mb-2">💡 Nueva solución</p>
          <p className="text-gray-300 text-sm">
            En lugar de modificar la tabla appointments (que requiere permisos especiales),
            creamos una tabla separada para rastrear los recordatorios.
          </p>
        </div>

        {tableExists ? (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-400 mb-2">✅ Ya configurado</h2>
            <p className="text-gray-300">La tabla `reminders_log` ya existe.</p>
            <p className="text-gray-400 text-sm mt-2">
              El sistema ya puede enviar recordatorios de 1 hora antes.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4">⚠️ Configuración requerida</h2>
            <p className="text-gray-300 mb-4">
              Necesitas crear la tabla `reminders_log` en la base de datos. Sigue estos pasos:
            </p>

            <ol className="text-gray-300 space-y-3 list-decimal list-inside mb-6">
              <li>
                Ve a <a href="https://supabase.com/dashboard/project/zzaetaljaxxuvbgnfdvc/sql" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Supabase SQL Editor</a>
              </li>
              <li>
                Copia y ejecuta este SQL:
              </li>
            </ol>

            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <pre className="text-sm text-green-400 overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS reminders_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  reminder_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_log_appointment_id
ON reminders_log(appointment_id);

ALTER TABLE reminders_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to reminders_log"
ON reminders_log FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read reminders_log"
ON reminders_log FOR SELECT
USING (auth.role() = 'authenticated');

ALTER PUBLICATION supabase_realtime ADD TABLE reminders_log;`}
              </pre>
            </div>

            <button
              onClick={() => window.open('https://supabase.com/dashboard/project/zzaetaljaxxuvbgnfdvc/sql', '_blank')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
            >
              Abrir Supabase SQL Editor
            </button>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-sm">
            Después de ejecutar el SQL, haz clic en "Verificar de nuevo".
          </p>
          <button
            onClick={checkTable}
            className="mt-2 text-orange-400 hover:text-orange-300 text-sm"
          >
            ↻ Verificar de nuevo
          </button>
        </div>
      </div>
    </div>
  );
}
