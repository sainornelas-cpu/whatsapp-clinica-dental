'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponent } from '@/lib/supabase';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponent();

  const isActive = (path: string) => pathname?.startsWith(path);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { path: '/dashboard/conversations', label: 'Conversaciones', icon: '💬' },
    { path: '/dashboard/calendar', label: 'Calendario', icon: '📆' },
    { path: '/dashboard/appointments', label: 'Citas', icon: '📅' },
    { path: '/dashboard/patients', label: 'Pacientes', icon: '👥' },
    { path: '/dashboard/analytics', label: 'Analítica', icon: '📊' },
  ];

  return (
    <aside className="w-64 bg-gray-800 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Clínica Dental Sonrisa</h1>
        <p className="text-sm text-gray-400">Panel de Administración</p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-orange-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-8 pt-8 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}