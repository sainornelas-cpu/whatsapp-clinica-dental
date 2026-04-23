import { ReactNode } from 'react';
import { createClientComponent } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createClientComponent();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <DashboardSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}