import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

// GET /api/check-webhook - Verificar estado del webhook y citas
export async function GET(request: NextRequest) {
  try {
    // Verificar si hay webhooks recibidos recientemente
    // (Esto requeriría una tabla de logs, por ahora solo verificamos citas)

    // Obtener citas recientes para ver si se están actualizando
    const { data: recentAppointments, error: aptError } = await supabaseService
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (aptError) {
      return NextResponse.json({ error: aptError.message }, { status: 500 });
    }

    // Contar por estado
    const pending = recentAppointments?.filter(a => a.status === 'pending').length || 0;
    const scheduled = recentAppointments?.filter(a => a.status === 'scheduled').length || 0;
    const cancelled = recentAppointments?.filter(a => a.status === 'cancelled').length || 0;

    return NextResponse.json({
      webhook: {
        url: 'https://whatsapp-clinica-dental.vercel.app/api/cal-webhook',
        status: 'Configurado en Cal.com (según usuario)',
      },
      appointments: {
        recent: recentAppointments?.map(apt => ({
          id: apt.id,
          service_type: apt.service_type,
          status: apt.status,
          phone: apt.phone_number,
          created_at: apt.created_at,
          updated_at: apt.updated_at,
          cal_booking_uid: apt.cal_booking_uid?.substring(0, 20) + '...', // Mostrar solo parte del UID
        })),
        summary: {
          pending,
          scheduled,
          cancelled,
        }
      },
      diagnosis: pending > 0 && scheduled === 0
        ? '⚠️ PROBLEMA: Hay citas pendientes pero ninguna confirmada. El webhook puede no estar enviando eventos.'
        : pending === 0 && scheduled > 0
        ? '✅ OK: Las citas se están confirmando correctamente.'
        : '⚠️ Mixto: Hay citas pendientes y confirmadas. El webhook funciona pero algunas no se completaron.',
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
