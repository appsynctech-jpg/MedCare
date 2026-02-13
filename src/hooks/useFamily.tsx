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

        // Use a persistent channel name for the user
        const channelId = `panic_alerts_${user.id}`;

        console.log('🏗️ Iniciando subscrição Realtime:', channelId);

        const channel = supabase
            .channel(channelId)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'panic_logs'
                },
                async (payload) => {
                    console.log('🔔 EVENTO REALTIME RECEBIDO:', payload);
                    const newPanic = payload.new;

                    const relation = relationshipsRef.current.find(r => r.patient_id === newPanic.user_id);

                    if (relation) {
                        const patientName = relation.profiles?.full_name || 'Um familiar';
                        console.log('🚨 ALERTA VÁLIDO ENCONTRADO PARA:', patientName);
                        setActivePanicAlert({ ...newPanic, patientName });

                        // Browser Notification
                        if (!Capacitor.isNativePlatform() && Notification.permission === 'granted') {
                            new Notification(`🚨 EMERGÊNCIA: ${patientName}`, {
                                body: 'Acionou o botão de pânico! Verifique agora.',
                                icon: '/MedCare.png'
                            });
                        }

                        // Native Notification (Mobile) - High Priority
                        if (Capacitor.isNativePlatform()) {
                            const sendNative = async () => {
                                await LocalNotifications.createChannel({
                                    id: 'sos-alerts',
                                    name: 'Alertas de Emergência',
                                    description: 'Alertas críticos de pânico',
                                    importance: 5,
                                    visibility: 1,
                                    vibration: true
                                });

                                await LocalNotifications.schedule({
                                    notifications: [
                                        {
                                            title: `🚨 EMERGÊNCIA: ${patientName}`,
                                            body: 'Acionou o botão de pânico! Verifique agora.',
                                            id: Date.now(),
                                            schedule: { at: new Date(Date.now() + 500) },
                                            sound: 'resource://raw/emergency_siren',
                                            channelId: 'sos-alerts',
                                            smallIcon: 'ic_stat_name',
                                        }
                                    ]
                                });
                            };
                            sendNative();
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log(`📡 [${channelId}] Status:`, status);

                if (status === 'SUBSCRIBED') {
                    setRealtimeConnected(true);
                    setRetryCount(0);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    setRealtimeConnected(false);
                    console.error(`❌ Erro no canal ${channelId}:`, status);

                    if (user && retryCount < 10) {
                        const timeout = Math.min(2000 * Math.pow(1.5, retryCount), 15000);
                        setTimeout(() => {
                            setRetryCount(prev => prev + 1);
                        }, timeout);
                    }
                }
            });

        return () => {
            console.log('🧹 Desconectando canal:', channelId);
            supabase.removeChannel(channel);
        };
    }, [user?.id, retryCount]);

    const isCaregiverMode = !!selectedPatient;

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
            refreshFamily: fetchRelationships
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
