'use client';

import { useEffect, useState } from 'react';

export default function DiagnosePage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [supabaseTest, setSupabaseTest] = useState<{ status: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [browserInfo, setBrowserInfo] = useState<{ userAgent: string; url: string } | null>(null);

  useEffect(() => {
    // Check environment variables
    const vars: Record<string, string> = {
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ NO CONFIGURADA',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ NO CONFIGURADA',
    };
    setEnvVars(vars);

    // Get browser info (only on client)
    setBrowserInfo({
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Test Supabase connection
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        setSupabaseTest({
          status: 'error',
          message: 'Faltan variables de entorno de Supabase'
        });
        return;
      }

      const supabase = createClient(url, key);

      // Simple test
      const { data, error } = await supabase
        .from('patients')
        .select('count', { count: 'exact', head: true });

      if (error) {
        setSupabaseTest({
          status: 'error',
          message: `Error de Supabase: ${error.message}`
        });
      } else {
        setSupabaseTest({
          status: 'success',
          message: `Conexión exitosa. Pacientes: ${data || 0}`
        });
      }
    } catch (error: any) {
      setSupabaseTest({
        status: 'error',
        message: `Error al cargar Supabase: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🔍 Diagnóstico del Sistema</h1>

        {/* Environment Variables */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Variables de Entorno</h2>
          <div className="space-y-3">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <code className="text-orange-400 text-sm">{key}</code>
                <span className={value.includes('✅') ? 'text-green-400' : 'text-red-400'}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Supabase Test */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Prueba de Conexión a Supabase</h2>
          {loading ? (
            <div className="flex items-center gap-3 text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              <span>Probando conexión...</span>
            </div>
          ) : supabaseTest ? (
            <div className={`p-4 rounded-lg ${
              supabaseTest.status === 'success'
                ? 'bg-green-500/20 border border-green-500/50'
                : 'bg-red-500/20 border border-red-500/50'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {supabaseTest.status === 'success' ? '✅' : '❌'}
                </span>
                <div>
                  <div className={`font-semibold ${
                    supabaseTest.status === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {supabaseTest.status === 'success' ? 'Conexión Exitosa' : 'Error de Conexión'}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{supabaseTest.message}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Browser Info */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Información del Navegador</h2>
          {browserInfo ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="text-gray-400">User Agent</div>
                <div className="text-white mt-1 truncate">{browserInfo.userAgent}</div>
              </div>
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="text-gray-400">URL Actual</div>
                <div className="text-white mt-1 truncate">{browserInfo.url}</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">Cargando información del navegador...</div>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">💡 Recomendaciones</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-gray-300">
              <span className="text-orange-400">1.</span>
              <div>
                <p className="font-medium text-white">Configurar variables en Vercel</p>
                <p className="text-sm">Ve a Vercel → Settings → Environment Variables y agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-gray-300">
              <span className="text-orange-400">2.</span>
              <div>
                <p className="font-medium text-white">Verificar RLS en Supabase</p>
                <p className="text-sm">Asegúrate de que las políticas RLS permitan acceso anónimo desde el dominio de Vercel</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-gray-300">
              <span className="text-orange-400">3.</span>
              <div>
                <p className="font-medium text-white">Usar el dashboard mock</p>
                <p className="text-sm">Mientras configuras Supabase, usa /dashboard-mock para ver la interfaz con datos de ejemplo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Variables for Vercel */}
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">📝 Variables para Configurar en Vercel</h2>
          <div className="space-y-4 font-mono text-sm">
            <div>
              <div className="text-gray-400 mb-1">NEXT_PUBLIC_SUPABASE_URL</div>
              <div className="text-white bg-gray-800 p-2 rounded">https://zzaetaljaxxuvbgnfdvc.supabase.co</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
              <div className="text-white bg-gray-800 p-2 rounded break-all">
                eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6YWV0YWxqYXh4dXZiZ25mZHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDI2NzEsImV4cCI6MjA5MTY3ODY3MX0.QHORagfUjovVhxNmU7BGFJxT97sFCaUal29edDB1Eek
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/dashboard-mock"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium inline-block"
          >
            Ir al Dashboard Demo
          </a>
        </div>
      </div>
    </div>
  );
}
