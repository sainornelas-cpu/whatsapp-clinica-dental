import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  if (!serviceRoleKey) {
    return NextResponse.json({
      error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada'
    }, { status: 500 });
  }

  try {
    // Intentar ejecutar el SQL usando la API de Supabase
    // Nota: La API REST estándar no soporta ALTER TABLE, pero intentaremos con PostgreSQL direct connection
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        sql: `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT FALSE;`
      }),
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Columna reminder_1h_sent agregada exitosamente'
      });
    }

    const error = await response.json();

    // Si falla con la API, intentamos otra vía
    // Vamos a intentar usando el endpoint de consultas directo
    return NextResponse.json({
      success: false,
      message: 'La API REST no soporta ALTER TABLE directamente',
      error: error,
      instructions: 'Debes ejecutar el SQL manualmente en el dashboard de Supabase',
      sql: 'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT FALSE;'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Error al intentar ejecutar la migración'
    }, { status: 500 });
  }
}
