export default function UltraSimplePage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: '#fff',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        ✅ Página Ultra Simple
      </h1>
      <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
        Si ves esto, el renderizado básico funciona.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <a
          href="/dashboard-mock"
          style={{
            backgroundColor: '#f97316',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            textDecoration: 'none'
          }}
        >
          Dashboard Mock
        </a>
        <a
          href="/diagnose"
          style={{
            backgroundColor: '#374151',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            textDecoration: 'none'
          }}
        >
          Diagnóstico
        </a>
      </div>
    </div>
  );
}
