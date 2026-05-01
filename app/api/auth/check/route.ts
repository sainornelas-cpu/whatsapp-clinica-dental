import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const result: any = {
    timestamp: new Date().toISOString(),
    envConfigured: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  };

  try {
    // Intentar conectar con Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verificar si podemos leer la tabla de usuarios
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      result.usersError = usersError.message;
    } else {
      result.totalUsers = users.users.length;
      const adminUser = users.users.find((u: any) => u.email === 'sain.ornelas@uabc.edu.mx');
      if (adminUser) {
        result.adminUser = {
          id: adminUser.id,
          email: adminUser.email,
          confirmed: !!adminUser.email_confirmed_at,
          lastSignIn: adminUser.last_sign_in_at,
        };
      } else {
        result.adminUser = null;
      }
    }

    // Intentar una consulta simple a la base de datos
    const { data: patients, error: dbError } = await supabase
      .from('patients')
      .select('count', { count: 'exact', head: true });

    if (dbError) {
      result.dbError = dbError.message;
      result.dbErrorCode = dbError.code;
    } else {
      result.patientsCount = patients;
    }

    result.success = true;
  } catch (error: any) {
    result.error = error.message;
    result.success = false;
  }

  return NextResponse.json(result);
}
