'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, DollarSign, BarChart3 } from 'lucide-react';

const adminTabs = [
  {
    label: 'Обзор',
    href: '/admin/overview',
    icon: LayoutDashboard,
  },
  {
    label: 'Пользователи',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Финансы',
    href: '/admin/finance',
    icon: DollarSign,
  },
  {
    label: 'Аналитика',
    href: '/admin/analytics',
    icon: BarChart3,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-b bg-background">
      <div className="container mx-auto">
        <nav className="flex space-x-1 px-4" aria-label="Admin navigation">
          {adminTabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors hover:text-primary border-b-2',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
