'use client';

import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminNav } from '@/components/admin/AdminNav';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';
import { Shield } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto">
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">Админ Панель</h1>
                  <p className="text-xs text-muted-foreground">
                    Управление платформой
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/chat"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Вернуться в чат
                </Link>
                <ThemeToggle />
                <UserMenu onLogout={handleLogout} />
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <AdminNav />

        {/* Main Content */}
        <main className="flex-1 bg-secondary/30">
          <div className="container mx-auto py-8 px-4">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t py-4 bg-background">
          <div className="container mx-auto px-4">
            <p className="text-center text-xs text-muted-foreground">
              AI Chat Platform Admin Panel © 2026
            </p>
          </div>
        </footer>
      </div>
    </AdminGuard>
  );
}
