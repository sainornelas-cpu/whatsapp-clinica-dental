import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

// GET /api/webhook-logs - Ver logs de webhooks recibidos
export async function GET(request: NextRequest) {
  try {
    // Nota: Esto requeriría una tabla de logs en Supabase
    // Por ahora, devolvemos información útil

    // Obtener citas para ver patrones de actualización
    const { data: appointments, error } = await supabaseService
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Analizar patrones
    const logs = appointments?.map(apt => ({
      created: new Date(apt.created_at).toISOString(),
      updated: new Date(apt.updated_at).toISOString(),
      time_diff: apt.updated_at && apt.created_at
        ? Math.round((new Date(apt.updated_at).getTime() - new Date(apt.created_at).getTime()) / 1000)
        : null,
      status: apt.status,
      phone: apt.phone_number,
      service: apt.service_type,
      uid_prefix: apt.cal_booking_uid?.startsWith('booking_') ? 'generated' : 'calcom',
    })) || [];

    return NextResponse.json({
      logs,
      analysis: {
        total: logs.length,
        confirmed: logs.filter(l => l.status === 'scheduled').length,
        pending: logs.filter(l => l.status === 'pending').length,
        uid_from_calcom: logs.filter(l => l.uid_prefix === 'calcom').length,
        uid_generated: logs.filter(l => l.uid_prefix === 'generated').length,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
