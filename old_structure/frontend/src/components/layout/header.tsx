'use client';

import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/todos': 'Todos',
  '/fundflow': 'Fundflow',
  '/settings': 'Settings',
};

export function Header() {
  const pathname = usePathname();

  // Get the page title based on the current pathname
  const getPageTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname === path || pathname?.startsWith(path + '/')) {
        return title;
      }
    }
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-white px-6">
      <h1 className="text-2xl font-semibold text-gray-900">{getPageTitle()}</h1>
    </header>
  );
}
