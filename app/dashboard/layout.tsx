import { ReactNode } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardGuard from '@/components/DashboardGuard';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardGuard>
      <div className="flex min-h-screen bg-gray-900">
        <DashboardSidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </DashboardGuard>
  );
}