import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePanic() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isTriggering, setIsTriggering] = useState(false);

    const triggerPanic = useCallback(async () => {
        if (isTriggering) return;
        setIsTriggering(true);

        let lat: number | null = null;
        let lng: number | null = null;

        try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                })
            );
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
        } catch (error) {
            console.warn('Panic location error:', error);
        }

        if (user) {
            const { data: logRecord, error: logError } = await supabase.from('panic_logs').insert({
                user_id: user.id,
                latitude: lat,
                longitude: lng,
                message: 'Preciso de ajuda urgente!',
                contacts_notified: [],
            }).select().single();

            if (!logError && logRecord) {
                await supabase.functions.invoke('send-security-alert', {
                    body: {
                        type: 'INSERT',
                        table: 'panic_logs',
                        record: logRecord
                    }
                });
            }
        }

        toast({
            variant: 'destructive',
            title: '🚨 Socorro Enviado!',
            description: 'Seus contatos foram notificados com sua localização.'
        });

        setIsTriggering(false);
    }, [user, toast, isTriggering]);

    return { triggerPanic, isTriggering };
}
