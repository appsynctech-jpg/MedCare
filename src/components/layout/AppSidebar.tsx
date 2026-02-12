import { LayoutDashboard, Pill, CalendarDays, FileText, Settings, LogOut, Stethoscope, ShieldCheck, ShieldAlert } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useFamily } from '@/hooks/useFamily';
import { Badge } from '@/components/ui/badge';
import { User, ChevronDown, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Medicamentos', url: '/medications', icon: Pill },
  { title: 'Consultas', url: '/appointments', icon: CalendarDays },
  { title: 'Médicos', url: '/doctors', icon: Stethoscope },
  { title: 'Documentos', url: '/documents', icon: FileText },
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const { selectedPatient, setSelectedPatient, relationships, loading, realtimeConnected } = useFamily();

  const handlePatientSelect = (patient: any | null) => {
    setSelectedPatient(patient);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-6 flex items-center justify-center border-b mb-2">
          <img src="/MedCare.png" alt="MedCare Logo" className="h-14 w-auto drop-shadow-md" />
        </div>
        <SidebarGroup>
          <div className="px-4 py-2">
            <SidebarGroupLabel>Perfil Ativo</SidebarGroupLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between mt-1 h-12 bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-xs text-primary uppercase">
                      {selectedPatient?.full_name
                        ? selectedPatient.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')
                        : user?.user_metadata?.full_name
                          ? user.user_metadata.full_name.split(' ').map((n: any) => n[0]).slice(0, 2).join('')
                          : <User className="h-4 w-4" />
                      }
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-sm font-semibold truncate leading-tight">
                        {selectedPatient?.full_name || user?.user_metadata?.full_name || 'Seu Perfil'}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">
                        {selectedPatient ? 'Monitorando' : 'Sua Conta'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[calc(var(--radix-dropdown-menu-trigger-width)-8px)] ml-1" align="start">
                <DropdownMenuLabel>Alternar Perfil</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handlePatientSelect(null)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Sua Conta</span>
                </DropdownMenuItem>

                {relationships.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Familiares</DropdownMenuLabel>
                    {relationships.map((rel) => (
                      <DropdownMenuItem key={rel.id} onClick={() => handlePatientSelect((rel as any).profiles)} className="gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary uppercase">
                          {(rel as any).profiles?.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{(rel as any).profiles?.full_name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">Paciente</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>

          {relationships.length > 0 && (
            <div className="mx-4 mt-6 p-3 rounded-xl bg-card/30 border border-primary/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sistema SOS</span>
                <div className="flex items-center gap-1.5 font-bold text-[9px]">
                  <div className={`h-1.5 w-1.5 rounded-full ${realtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {realtimeConnected ? (
                    <span className="text-emerald-500">LIVE</span>
                  ) : (
                    <span className="text-red-500">OFFLINE</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {realtimeConnected
                  ? "Monitoramento ativo. Você receberá alertas de pânico instantâneos."
                  : "Erro de conexão. Verifique sua internet para receber alertas."
                }
              </p>
            </div>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
