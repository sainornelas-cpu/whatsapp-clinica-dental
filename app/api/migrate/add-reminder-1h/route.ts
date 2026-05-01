import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('Running migration: Add reminder_1h_sent column to appointments table');

    // Intentar agregar la columna
    const { error: alterError } = await supabaseService.rpc('exec_sql', {
      sql: `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT FALSE;`
    });

    // Supabase no tiene exec_sql, así que usamos el método directo
    // Vamos a intentar con una consulta simple primero para verificar la conexión
    const { data: testData, error: testError } = await supabaseService
      .from('appointments')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      console.error('Test query failed:', testError);
      return NextResponse.json({
        success: false,
        error: 'No se puede conectar a la base de datos',
        details: testError.message
      }, { status: 500 });
    }

    // Como no podemos ejecutar ALTER TABLE directamente desde el cliente Supabase,
    // necesitamos que el usuario lo ejecute manualmente con la cuenta correcta
    return NextResponse.json({
      success: false,
      message: 'No se puede ejecutar ALTER TABLE desde este endpoint debido a permisos.',
      instructions: [
        '1. Ve a Supabase Dashboard: https://supabase.com/dashboard/project/zzaetaljaxxuvbgnfdvc/sql',
        '2. Asegúrate de estar logueado como OWNER del proyecto',
        '3. Ejecuta este SQL:',
        'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT FALSE;'
      ],
      note: 'Si sigues teniendo problemas de permisos, verifica que estés usando la cuenta correcta de Supabase (la del owner del proyecto).'
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  // Verificar si la columna ya existe
  try {
    const { data, error } = await supabaseService
      .from('appointments')
      .select('reminder_1h_sent')
      .limit(1);

    if (error && error.message.includes('column') && error.message.includes('does not exist')) {
      return NextResponse.json({
        exists: false,
        message: 'La columna reminder_1h_sent NO existe en la tabla appointments'
      });
    }

    if (error) {
      return NextResponse.json({
        error: error.message,
        message: 'Error verificando la columna'
      }, { status: 500 });
    }

    return NextResponse.json({
      exists: true,
      message: 'La columna reminder_1h_sent ya existe en la tabla appointments'
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
