import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function GET() {
  try {
    // Intentar consultar la tabla reminders_log
    const { data, error } = await supabaseService
      .from('reminders_log')
      .select('count', { count: 'exact', head: true });

    if (error) {
      // Si el error menciona que la tabla no existe
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({
          exists: false,
          message: 'La tabla reminders_log no existe'
        });
      }

      // Otro error
      return NextResponse.json({
        error: error.message,
        message: 'Error verificando la tabla'
      }, { status: 500 });
    }

    // La tabla existe
    return NextResponse.json({
      exists: true,
      message: 'La tabla reminders_log ya existe',
      count: data
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
