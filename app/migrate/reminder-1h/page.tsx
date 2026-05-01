'use client';

import { useEffect, useState } from 'react';

export default function MigrateReminder1hPage() {
  const [columnExists, setColumnExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkColumn();
  }, []);

  const checkColumn = async () => {
    try {
      const res = await fetch('/api/migrate/add-reminder-1h');
      const data = await res.json();
      setColumnExists(data.exists);
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

        {columnExists ? (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-400 mb-2">✅ Ya configurado</h2>
            <p className="text-gray-300">La columna `reminder_1h_sent` ya existe en la tabla de citas.</p>
          </div>
        ) : (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4">⚠️ Configuración requerida</h2>
            <p className="text-gray-300 mb-4">
              Necesitas agregar una columna a la base de datos. Sigue estos pasos:
            </p>

            <ol className="text-gray-300 space-y-3 list-decimal list-inside mb-6">
              <li>
                Ve a <a href="https://supabase.com/dashboard/project/zzaetaljaxxuvbgnfdvc/sql" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Supabase SQL Editor</a>
              </li>
              <li>
                Asegúrate de estar logueado con la cuenta <strong>OWNER</strong> del proyecto (sain.ornelas@uabc.edu.mx)
              </li>
              <li>
                Copia y ejecuta este SQL:
              </li>
            </ol>

            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <pre className="text-sm text-green-400">
                ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT FALSE;
              </pre>
            </div>

            <button
              onClick={() => window.open('https://supabase.com/dashboard/project/zzaetaljaxxuvbgnfdvc/sql', '_blank')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
            >
              Abrir Supabase SQL Editor
            </button>

            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">
                <strong>Error de permisos:</strong> Si ves "must be owner of table",
                asegúrate de estar logueado con la cuenta correcta del dueño del proyecto.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-sm">
            Después de ejecutar el SQL, recarga esta página para verificar.
          </p>
          <button
            onClick={checkColumn}
            className="mt-2 text-orange-400 hover:text-orange-300 text-sm"
          >
            ↻ Verificar de nuevo
          </button>
        </div>
      </div>
    </div>
  );
}
