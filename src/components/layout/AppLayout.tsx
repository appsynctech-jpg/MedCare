import { Outlet, Navigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAuth } from '@/hooks/useAuth';
import { useFamily } from '@/hooks/useFamily';
import { Loader2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { PanicAlarmDialog } from '@/components/emergency/PanicAlarmDialog';
import AssistantChat from '@/components/ai/AssistantChat';

export function AppLayout() {
  const { user, loading: authLoading } = useAuth();
  const { isCaregiverMode, selectedPatient } = useFamily();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    // Apply theme from localStorage immediately to prevent flash
    const savedTheme = localStorage.getItem('medcare-theme') || 'light';
    const savedFontSize = localStorage.getItem('medcare-font-size') || 'md';
    document.documentElement.classList.remove('dark', 'high-contrast');
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    if (savedTheme === 'high-contrast') document.documentElement.classList.add('high-contrast');
    document.documentElement.setAttribute('data-font-size', savedFontSize);
  }, []);

  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, theme, font_size')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setShowOnboarding(!data.onboarding_completed);

        // Apply theme from DB and sync to localStorage
        const theme = data.theme || 'light';
        const fontSize = data.font_size || 'md';

        document.documentElement.classList.remove('dark', 'high-contrast');
        if (theme === 'dark') document.documentElement.classList.add('dark');
        if (theme === 'high-contrast') document.documentElement.classList.add('high-contrast');
        document.documentElement.setAttribute('data-font-size', fontSize);

        localStorage.setItem('medcare-theme', theme);
        localStorage.setItem('medcare-font-size', fontSize);
      }
      setProfileLoading(false);
    };

    fetchProfileData();
  }, [user]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (showOnboarding) {
    return <OnboardingFlow userId={user.id} onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <div className={`flex flex-1 flex-col transition-colors duration-500 ${isCaregiverMode ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''}`}>
          <AppHeader />
          {isCaregiverMode && (
            <div className="bg-indigo-600 text-white px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top duration-300">
              <Users className="h-3.5 w-3.5" />
              Monitorando: {selectedPatient?.full_name}
            </div>
          )}
          <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden overflow-y-auto p-2 md:p-6 no-scrollbar">
            <Outlet />
          </main>
        </div>
      </div>
      <PanicAlarmDialog />
      <AssistantChat />
    </SidebarProvider>
  );
}
