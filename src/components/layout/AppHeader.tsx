import { SidebarTrigger } from '@/components/ui/sidebar';
import { EmergencyButton } from '@/components/emergency/EmergencyButton';
import { UserMenu } from '@/components/layout/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { Heart } from 'lucide-react';

export function AppHeader() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name?.split(' ')[0];

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary/60" />
          {name && (
            <span className="text-sm font-medium text-muted-foreground ml-1">
              Olá, <span className="text-foreground font-bold">{name}</span>!
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <EmergencyButton />
        <UserMenu />
      </div>
    </header>
  );
}
