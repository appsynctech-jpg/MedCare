import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import type { CaregiverRelationship, Profile } from '@/types';

interface FamilyContextType {
    selectedPatient: Profile | null;
    setSelectedPatient: (patient: Profile | null) => void;
    relationships: CaregiverRelationship[];
    pendingInvites: CaregiverRelationship[];
    loading: boolean;
    isCaregiverMode: boolean;
    activePanicAlert: any | null;
    dismissPanicAlert: () => void;
    realtimeConnected: boolean;
    refreshFamily: () => Promise<void>;
    addDependent: (fullName: string, birthDate?: string, relationship?: string) => Promise<any>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedPatient, setSelectedPatient] = useState<Profile | null>(null);
    const [relationships, setRelationships] = useState<CaregiverRelationship[]>([]);
    const [pendingInvites, setPendingInvites] = useState<CaregiverRelationship[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePanicAlert, setActivePanicAlert] = useState<any | null>(null);
    const [realtimeConnected, setRealtimeConnected] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Stable ref for relationships to avoid closure problems in Realtime listener
    const relationshipsRef = useRef<CaregiverRelationship[]>([]);

    const fetchRelationships = async () => {
        if (!user) {
            setRelationships([]);
            setPendingInvites([]);
            setSelectedPatient(null);
            setLoading(false);
            return;
        }

        const { data } = await supabase
            .from('caregiver_relationships')
            .select('*, profiles:patient_id(*)')
            .eq('caregiver_id', user.id);

        const accepted = data?.filter(r => r.status === 'accepted') || [];
        const pending = data?.filter(r => r.status === 'pending') || [];

        setRelationships(accepted as any);
        relationshipsRef.current = accepted as any;
        setPendingInvites(pending as any);
        setLoading(false);
    };

    useEffect(() => {
        fetchRelationships();
    }, [user]);

    useEffect(() => {
        if (!user) return;

        // Simplified and persistent channel name
        const channelName = `sos_monitor_${user.id.slice(0, 8)}`;
        console.log('🏗️ [Realtime] Iniciando subscrição:', channelName);

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'panic_logs'
                },
                async (payload) => {
                    console.log('🚨 [Realtime] EVENTO RECEBIDO:', payload);
                    const newPanic = payload.new;
                    const relation = relationshipsRef.current.find(r => r.patient_id === newPanic.user_id);

                    if (relation) {
                        const patientName = relation.profiles?.full_name || 'Um familiar';
                        setActivePanicAlert({ ...newPanic, patientName });

                        if (!Capacitor.isNativePlatform() && Notification.permission === 'granted') {
                            new Notification(`🚨 EMERGÊNCIA: ${patientName}`, {
                                body: 'Acionou o botão de pânico!',
                                icon: '/MedCare.png'
                            });
                        }

                        if (Capacitor.isNativePlatform()) {
                            LocalNotifications.schedule({
                                notifications: [{
                                    title: `🚨 EMERGÊNCIA: ${patientName}`,
                                    body: 'Acionou o botão de pânico!',
                                    id: Date.now(),
                                    schedule: { at: new Date(Date.now() + 500) },
                                    channelId: 'sos-alerts'
                                }]
                            });
                        }
                    }
                }
            )
            .subscribe((status, err) => {
                console.log(`📡 [Realtime] Status do canal ${channelName}:`, status);
                if (err) console.error('❌ [Realtime] Erro na subscrição:', err);

                if (status === 'SUBSCRIBED') {
                    setRealtimeConnected(true);
                    setRetryCount(0);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    setRealtimeConnected(false);

                    // Controlled retry logic without re-triggering the entire effect if possible
                    if (retryCount < 5) {
                        console.warn(`🔄 [Realtime] Tentando reconectar (${retryCount + 1}/5)...`);
                        const timer = setTimeout(() => setRetryCount(prev => prev + 1), 3000);
                        return () => clearTimeout(timer);
                    }
                }
            });

        return () => {
            console.log('🧹 [Realtime] Desconectando:', channelName);
            supabase.removeChannel(channel);
        };
    }, [user?.id, retryCount]);

    const isCaregiverMode = !!selectedPatient;

    const addDependent = async (fullName: string, birthDate?: string, relationship?: string) => {
        if (!user) return null;
        try {
            console.log('👶 Criando dependente:', fullName, birthDate, relationship);
            const { data, error } = await supabase.rpc('create_managed_profile', {
                profile_name: fullName,
                manager_id: user.id,
                profile_birth_date: birthDate || null,
                profile_relationship: relationship || null
            });

            if (error) throw error;

            console.log('✅ Dependente criado, recarregando vínculos...');
            await fetchRelationships();
            return data;
        } catch (error) {
            console.error('Erro ao adicionar dependente:', error);
            throw error;
        }
    };

    return (
        <FamilyContext.Provider value={{
            selectedPatient,
            setSelectedPatient,
            relationships,
            pendingInvites,
            loading,
            isCaregiverMode,
            activePanicAlert,
            realtimeConnected,
            dismissPanicAlert: () => setActivePanicAlert(null),
            refreshFamily: fetchRelationships,
            addDependent
        }}>
            {children}
        </FamilyContext.Provider>
    );
};

export const useFamily = () => {
    const context = useContext(FamilyContext);
    if (context === undefined) {
        throw new Error('useFamily must be used within a FamilyProvider');
    }
    return context;
};
