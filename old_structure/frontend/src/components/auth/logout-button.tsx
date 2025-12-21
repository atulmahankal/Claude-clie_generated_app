'use client';

import { LogOut } from 'lucide-react';
import { useLogout } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const logoutMutation = useLogout();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}
