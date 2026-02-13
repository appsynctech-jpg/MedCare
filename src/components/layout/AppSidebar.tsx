import { LayoutDashboard, Pill, CalendarDays, FileText, Settings, LogOut, Stethoscope, ShieldCheck, ShieldAlert, Lock } from 'lucide-react';
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
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Crown, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const { isPro, limits } = useSubscription();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      const checkAdmin = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setIsAdmin(data?.role === 'admin');
      };
      checkAdmin();
    }
  }, [user]);

  const handlePatientSelect = (patient: any | null) => {
    setSelectedPatient(patient);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center gap-2 px-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Pill className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-primary">MedCare</span>
          </div>

          {!realtimeConnected && (
            <div className="px-2 mb-4">
              <Badge variant="outline" className="w-full justify-center bg-yellow-50 text-yellow-700 border-yellow-200">
                <Zap className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            </div>
          )}

          <div className="px-2 mb-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-auto py-3 px-3 border-dashed">
                  <div className="flex items-center gap-3 text-left overflow-hidden">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      {selectedPatient ? (
                        <Users className="h-4 w-4 text-blue-600" />
                      ) : (
                        <User className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium leading-none truncate">
                        {selectedPatient ? selectedPatient.full_name : 'Meu Perfil'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedPatient ? 'Dependente' : 'Conta Principal'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>Alternar Perfil</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handlePatientSelect(null)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                  {selectedPatient === null && <Badge variant="secondary" className="ml-auto text-xs">Ativo</Badge>}
                </DropdownMenuItem>

                {relationships.length > 0 && <DropdownMenuSeparator />}
                {relationships.length > 0 && <DropdownMenuLabel>Dependentes</DropdownMenuLabel>}

                {relationships.map((rel: any) => (
                  <DropdownMenuItem key={rel.id} onClick={() => handlePatientSelect(rel.profiles)}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>{rel.profiles?.full_name}</span>
                    {selectedPatient?.id === rel.profiles?.id && <Badge variant="secondary" className="ml-auto text-xs">Ativo</Badge>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Admin Link - Only visible to admins */}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/landing">
                      <Lock className="mr-2 h-4 w-4" />
                      <span>Admin CMS</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pro Banner - Only show if not pro */}
        {!isPro && (
          <div className="px-4 mt-auto mb-4">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 text-white shadow-lg relative overflow-hidden group cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02]" onClick={() => navigate('/pricing')}>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-white/20 blur-2xl group-hover:bg-white/30 transition-colors" />
              <div className="absolute bottom-0 left-0 -ml-4 -mb-4 h-16 w-16 rounded-full bg-black/10 blur-xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Crown className="h-5 w-5 text-yellow-300 fill-yellow-300 animate-pulse" />
                  </div>
                  <span className="font-bold text-lg tracking-tight">Seja Premium</span>
                </div>

                <p className="text-white/90 text-sm mb-3 leading-relaxed">
                  Desbloqueie recursos ilimitados para cuidar da sua família.
                </p>

                <Button size="sm" variant="secondary" className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold border-0 shadow-sm">
                  Ver Planos
                  <Sparkles className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
