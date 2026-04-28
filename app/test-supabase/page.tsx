'use client';

import { useEffect, useState } from 'react';

export default function TestSupabasePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFromSupabase();
  }, []);

  const loadFromSupabase = async () => {
    try {
      // Import dinámico de Supabase para evitar problemas de SSR
      const { createClient } = await import('@supabase/supabase-js');

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Prueba simple
      const { data: patients, error: pError } = await supabase
        .from('patients')
        .select('*')
        .limit(5);

      if (pError) throw pError;

      const { data: appointments, error: aError } = await supabase
        .from('appointments')
        .select('*')
        .limit(5);

      if (aError) throw aError;

      setData({
        patients: patients || [],
        appointments: appointments || [],
        patientCount: patients?.length || 0,
        appointmentCount: appointments?.length || 0,
      });
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#111827',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #f97316',
            borderTop: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: '#fff',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            🧪 Test de Supabase
          </h1>
          <p style={{ color: '#9ca3af' }}>
            Prueba de conexión a la base de datos (sin gráficos)
          </p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <a
            href="/dashboard-mock"
            style={{
              backgroundColor: '#f97316',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontSize: '0.875rem'
            }}
          >
            ← Volver al Dashboard Mock
          </a>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {data && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                backgroundColor: '#1f2937',
                padding: '1.5rem',
                borderRadius: '0.5rem'
              }}>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Pacientes
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {data.patientCount}
                </div>
              </div>
              <div style={{
                backgroundColor: '#1f2937',
                padding: '1.5rem',
                borderRadius: '0.5rem'
              }}>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Citas
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {data.appointmentCount}
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#10b981',
              color: '#fff',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '2rem'
            }}>
              ✅ Supabase está funcionando correctamente
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                Últimos 5 Pacientes:
              </h3>
              {data.patients.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No hay pacientes registrados</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {data.patients.map((p: any) => (
                    <li key={p.id} style={{
                      backgroundColor: '#1f2937',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      borderRadius: '0.375rem'
                    }}>
                      <div style={{ fontWeight: '500' }}>{p.full_name || 'Sin nombre'}</div>
                      <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{p.phone_number}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
