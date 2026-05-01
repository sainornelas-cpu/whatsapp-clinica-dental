'use client';

import { useEffect, useState } from 'react';

interface AdminSetupResult {
  success?: boolean;
  error?: string;
  adminExists?: boolean;
  userCreated?: boolean;
  createdUser?: any;
  adminUser?: any;
  createUserError?: string;
}

interface AuthCheckResult {
  success?: boolean;
  error?: string;
  envConfigured?: boolean;
  totalUsers?: number;
  adminUser?: any;
  dbError?: string;
  dbErrorCode?: string;
  patientsCount?: number;
}

export default function DiagnosePage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [supabaseTest, setSupabaseTest] = useState<{ status: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [browserInfo, setBrowserInfo] = useState<{ userAgent: string; url: string } | null>(null);
  const [adminSetup, setAdminSetup] = useState<AdminSetupResult | null>(null);
  const [settingUpAdmin, setSettingUpAdmin] = useState(false);
  const [authCheck, setAuthCheck] = useState<AuthCheckResult | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [showSql, setShowSql] = useState(false);

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

  const setupAdmin = async () => {
    setSettingUpAdmin(true);
    setAdminSetup(null);

    try {
      const res = await fetch('/api/admin/setup');
      const data = await res.json();
      setAdminSetup(data);
    } catch (error: any) {
      setAdminSetup({ error: error.message });
    } finally {
      setSettingUpAdmin(false);
    }
  };

  const checkAuthServer = async () => {
    setCheckingAuth(true);
    setAuthCheck(null);

    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      setAuthCheck(data);
    } catch (error: any) {
      setAuthCheck({ error: error.message, success: false });
    } finally {
      setCheckingAuth(false);
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

          {supabaseTest?.status === 'success' && (
            <div className="mt-4 space-y-3">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-gray-300 mb-3">Diagnóstico de autenticación:</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={checkAuthServer}
                    disabled={checkingAuth}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {checkingAuth ? 'Verificando...' : 'Verificar Autenticación (Servidor)'}
                  </button>
                  <button
                    onClick={setupAdmin}
                    disabled={settingUpAdmin}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {settingUpAdmin ? 'Configurando...' : 'Crear Usuario Admin'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {authCheck && (
            <div className={`mt-4 p-4 rounded-lg ${
              authCheck.success ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
            }`}>
              <h3 className={`font-semibold mb-2 ${authCheck.success ? 'text-green-400' : 'text-red-400'}`}>
                {authCheck.success ? '✓ Verificación del Servidor' : '✗ Error en Servidor'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Variables configuradas:</span>
                  <span className={authCheck.envConfigured ? 'text-green-400' : 'text-red-400'}>
                    {authCheck.envConfigured ? 'Sí' : 'No'}
                  </span>
                </div>
                {authCheck.totalUsers !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total usuarios:</span>
                    <span className="text-white">{authCheck.totalUsers}</span>
                  </div>
                )}
                {authCheck.patientsCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pacientes en DB:</span>
                    <span className="text-white">{authCheck.patientsCount}</span>
                  </div>
                )}
                {authCheck.adminUser && (
                  <div className="mt-2 p-3 bg-gray-800 rounded">
                    <p className="text-gray-400 text-sm mb-1">Usuario Admin:</p>
                    <p className="text-white text-sm">ID: {authCheck.adminUser.id}</p>
                    <p className="text-white text-sm">Email: {authCheck.adminUser.email}</p>
                    <p className="text-sm">Confirmado: <span className={authCheck.adminUser.confirmed ? 'text-green-400' : 'text-yellow-400'}>
                      {authCheck.adminUser.confirmed ? 'Sí' : 'No'}
                    </span></p>
                    {authCheck.adminUser.lastSignIn && (
                      <p className="text-white text-sm">Último login: {new Date(authCheck.adminUser.lastSignIn).toLocaleString()}</p>
                    )}
                  </div>
                )}
                {authCheck.dbError && (
                  <div className="mt-2 p-2 bg-red-900 rounded text-red-200">
                    Error DB ({authCheck.dbErrorCode}): {authCheck.dbError}
                  </div>
                )}
                {authCheck.error && (
                  <div className="mt-2 p-2 bg-red-900 rounded text-red-200">
                    Error: {authCheck.error}
                  </div>
                )}
              </div>
            </div>
          )}

          {adminSetup && (
            <div className={`mt-4 p-4 rounded-lg ${
              adminSetup.success ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
            }`}>
              <h3 className={`font-semibold mb-2 ${adminSetup.success ? 'text-green-400' : 'text-red-400'}`}>
                {adminSetup.success ? '✓ Configuración del Admin' : '✗ Error'}
              </h3>
              {adminSetup.adminExists !== undefined && (
                <p className="text-gray-300">Usuario existe: <span className={adminSetup.adminExists ? 'text-green-400' : 'text-yellow-400'}>
                  {adminSetup.adminExists ? 'Sí' : 'No'}
                </span></p>
              )}
              {adminSetup.userCreated && (
                <p className="text-green-400 mt-2">✓ Usuario creado exitosamente</p>
              )}
              {adminSetup.error && (
                <p className="text-red-400 mt-2">Error: {adminSetup.error}</p>
              )}
              {adminSetup.createUserError && (
                <p className="text-yellow-400 mt-2">Error creación: {adminSetup.createUserError}</p>
              )}
              {(adminSetup.adminExists || adminSetup.userCreated) && (
                <div className="mt-3 p-3 bg-gray-800 rounded">
                  <p className="text-gray-400 text-sm">Credenciales:</p>
                  <p className="text-white">Email: sain.ornelas@uabc.edu.mx</p>
                  <p className="text-white">Password: Dental2026!</p>
                  <a href="/login" className="inline-block mt-2 text-orange-400 hover:underline">
                    Ir a Login →
                  </a>
                </div>
              )}
            </div>
          )}
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

        {/* SQL Setup */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">🔧 Configurar RLS en Supabase</h2>
            <button
              onClick={() => setShowSql(!showSql)}
              className="text-orange-400 hover:text-orange-300 text-sm"
            >
              {showSql ? 'Ocultar' : 'Mostrar'} SQL
            </button>
          </div>

          <p className="text-gray-400 mb-4">
            Si el dashboard no funciona, necesitas ejecutar este SQL en Supabase para configurar las políticas de seguridad (RLS).
          </p>

          {showSql && (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{`-- Habilitar RLS en todas las tablas
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Authenticated users can read patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can read appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can read conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can update conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can read messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;

-- Crear políticas para patients
CREATE POLICY "Authenticated users can read patients" ON patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert patients" ON patients FOR INSERT TO authenticated WITH CHECK (true);

-- Crear políticas para appointments
CREATE POLICY "Authenticated users can read appointments" ON appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert appointments" ON appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update appointments" ON appointments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Crear políticas para conversations
CREATE POLICY "Authenticated users can read conversations" ON conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update conversations" ON conversations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Crear políticas para messages
CREATE POLICY "Authenticated users can read messages" ON messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert messages" ON messages FOR INSERT TO authenticated WITH CHECK (true);`}</pre>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const sql = document.querySelector('pre')?.textContent;
                    if (sql) navigator.clipboard.writeText(sql);
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  📋 Copiar SQL
                </button>
                <a
                  href="https://supabase.com/dashboard/project/zzaetaljaxxuvbgnfdvc/sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  🚀 Abrir SQL Editor en Supabase
                </a>
              </div>

              <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside bg-gray-700/50 p-4 rounded-lg">
                <li>Haz clic en "Abrir SQL Editor en Supabase"</li>
                <li>Copia el SQL de arriba y pégalo en el editor</li>
                <li>Haz clic en "Run" para ejecutar</li>
                <li>Vuelve a esta página y prueba "Verificar Autenticación (Servidor)"</li>
              </ol>
            </div>
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
