import { SidebarTrigger } from '@/components/ui/sidebar';
import { EmergencyButton } from '@/components/emergency/EmergencyButton';
import { UserMenu } from '@/components/layout/UserMenu';
import { useAuth } from '@/hooks/useAuth';

export function AppHeader() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário';

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground ml-1">
            Olá, <span className="text-foreground font-bold">{firstName}</span>!
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <EmergencyButton />
        <UserMenu />
      </div>
    </header>
  );
}
