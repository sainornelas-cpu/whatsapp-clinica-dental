import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  const result: any = {
    timestamp: new Date().toISOString(),
    steps: [] as any[],
  };

  if (!serviceRoleKey) {
    result.error = 'SUPABASE_SERVICE_ROLE_KEY no está configurada';
    return NextResponse.json(result, { status: 500 });
  }

  // SQL completo para configurar RLS
  const sql = `
    -- Habilitar RLS en todas las tablas
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
    CREATE POLICY "Authenticated users can insert messages" ON messages FOR INSERT TO authenticated WITH CHECK (true);
  `;

  try {
    // Ejecutar SQL a través de la API de Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ sql }),
    });

    const data = await response.json();

    if (!response.ok) {
      result.error = data;
      return NextResponse.json(result, { status: response.status });
    }

    result.success = true;
    result.data = data;

  } catch (error: any) {
    result.error = error.message;
  }

  return NextResponse.json(result);
}

export async function GET() {
  const result: any = {
    timestamp: new Date().toISOString(),
    sql: `
-- Habilitar RLS en todas las tablas
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
CREATE POLICY "Authenticated users can insert messages" ON messages FOR INSERT TO authenticated WITH CHECK (true);
    `.trim(),
    instructions: [
      'Copia el SQL de arriba y pégalo en el SQL Editor de Supabase:',
      '1. Ve a https://supabase.com/dashboard/project/zzaetaljaxxuvbgnfdvc/sql',
      '2. Pega el código SQL',
      '3. Haz clic en "Run"'
    ],
    supabaseUrl: 'https://supabase.com/dashboard/project/zzaetaljaxxuvbgnfdvc/sql'
  };

  return NextResponse.json(result);
}
