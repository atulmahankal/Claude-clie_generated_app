'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CheckSquare, DollarSign, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { LogoutButton } from '@/components/auth/logout-button';
import { useCurrentUser } from '@/lib/hooks/use-auth';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Todos', href: '/todos', icon: CheckSquare },
  { name: 'Fundflow', href: '/fundflow', icon: DollarSign },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold">JAM Stack App</h1>
      </div>

      <Separator className="bg-gray-700" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-gray-700" />

      {/* User Section */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-lg bg-gray-800 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {user?.display_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {user?.display_name || 'User'}
            </p>
            <p className="truncate text-xs text-gray-400">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
        <div className="mt-2">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
