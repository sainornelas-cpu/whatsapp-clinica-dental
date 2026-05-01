'use client';

export default function MigrateReminder1hPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Recordatorio 1 Hora</h1>

        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-green-400 mb-2">✅ No requiere migración de base de datos</h2>
          <p className="text-gray-300">
            El recordatorio de 1 hora antes usa una solución que <strong>NO requiere modificar la base de datos</strong>.
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">📋 ¿Cómo funciona?</h3>
          <ul className="text-gray-300 space-y-2">
            <li>• El cron job se ejecuta cada hora (via cron-job.org)</li>
            <li>• Busca citas en una ventana de tiempo muy estrecha: 58-62 minutos en el futuro</li>
            <li>• Envía el recordatorio por WhatsApp</li>
            <li>• <strong>NO necesita marcar nada en la base de datos</strong></li>
          </ul>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">⚠️ Configuración requerida</h3>
          <p className="text-gray-300 mb-4">
            Solo necesitas configurar el servicio externo de cron jobs:
          </p>

          <ol className="text-gray-300 space-y-3 list-decimal list-inside">
            <li>
              Ve a <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">cron-job.org</a> y regístrate (es gratis)
            </li>
            <li>
              Crea un nuevo cron job:
              <ul className="ml-6 mt-2 space-y-1 text-sm">
                <li>• <strong>Title:</strong> WhatsApp Dental - Recordatorio 1h</li>
                <li>• <strong>Schedule:</strong> <code className="bg-gray-800 px-2 py-1 rounded">0 * * * *</code> (cada hora)</li>
                <li>• <strong>URL:</strong> <code className="bg-gray-800 px-2 py-1 rounded text-xs">https://whatsapp-clinica-dental.vercel.app/api/cron/reminders-1h</code></li>
                <li>• <strong>Method:</strong> GET</li>
                <li>• <strong>Headers:</strong> Agrega <code className="bg-gray-800 px-2 py-1 rounded">Authorization: Bearer tu_CRON_SECRET</code></li>
              </ul>
            </li>
            <li>
              Activa el job y verifícalo en los logs
            </li>
          </ol>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">🔒 Tu CRON_SECRET</h3>
          <p className="text-gray-400 text-sm mb-4">
            Necesitas este valor para configurar el header del cron job.
          </p>
          <div className="bg-gray-900 rounded p-4">
            <code className="text-orange-400 text-sm break-all">
              {process.env.NEXT_PUBLIC_CRON_SECRET || 'Verifica tu archivo .env.local'}
            </code>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Esta variable está en tu archivo <code className="text-orange-400">.env.local</code>
          </p>
        </div>

        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">
            <strong>Nota:</strong> No ejecutes scripts SQL. El sistema funciona sin modificaciones a la base de datos.
          </p>
        </div>
      </div>
    </div>
  );
}
