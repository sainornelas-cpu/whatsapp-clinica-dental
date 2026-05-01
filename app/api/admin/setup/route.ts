import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function GET() {
  const result: any = {
    timestamp: new Date().toISOString(),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };

  try {
    // Verificar si el usuario administrador existe
    const { data: { users }, error: listError } = await supabaseService.auth.admin.listUsers();

    if (listError) {
      result.usersError = listError.message;
      return NextResponse.json(result, { status: 500 });
    }

    const adminEmail = 'sain.ornelas@uabc.edu.mx';
    const existingUser = users?.find(u => u.email === adminEmail);

    result.adminExists = !!existingUser;

    if (existingUser) {
      result.adminUser = {
        id: existingUser.id,
        email: existingUser.email,
        emailConfirmed: existingUser.email_confirmed_at !== null,
        lastSignIn: existingUser.last_sign_in_at,
      };
    }

    // Intentar crear el usuario si no existe
    if (!existingUser) {
      const { data: newUser, error: createError } = await supabaseService.auth.admin.createUser({
        email: adminEmail,
        password: 'Dental2026!',
        email_confirm: true,
      });

      if (createError) {
        result.createUserError = createError.message;
      } else {
        result.userCreated = true;
        result.createdUser = {
          id: newUser.user?.id,
          email: newUser.user?.email,
        };
      }
    }

    result.success = true;
    return NextResponse.json(result);
  } catch (error: any) {
    result.error = error.message;
    return NextResponse.json(result, { status: 500 });
  }
}
