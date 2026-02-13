import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Medication, MedicationSchedule } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, Clock, CheckCircle, Bell, BellOff } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

import { useFamily } from '@/hooks/useFamily';

async function callSecurityAlert(payload: any) {
    try {
        const { data, error } = await supabase.functions.invoke('send-security-alert', {
            body: {
                type: 'INSERT',
                table: payload.table,
                record: payload.record
            }
        });
        if (error) console.error("Error calling security alert:", error);
    } catch (e) {
        console.error("Security alert failed:", e);
    }
}

type MedWithSchedules = Medication & { medication_schedules: MedicationSchedule[] };

interface AlarmContextType {
    requestPermission: () => Promise<void>;
    permissionGranted: boolean;
    meds: MedWithSchedules[];
    todayLogs: any[];
    refreshData: () => Promise<void>;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export const MedicationAlarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { selectedPatient, activePanicAlert } = useFamily();

    const [meds, setMeds] = useState<MedWithSchedules[]>([]);
    const [todayLogs, setTodayLogs] = useState<any[]>([]);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [activeAlarms, setActiveAlarms] = useState<{ med: MedWithSchedules; schedule: MedicationSchedule }[]>([]);
    const [ringing, setRinging] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastCheckedMinute = useRef<string>('');
    const targetUserId = selectedPatient?.id || user?.id;

    // Local storage for snoozed alarms: { [scheduleId: string]: expirationTimestamp }
    const [snoozedAlarms, setSnoozedAlarms] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('medcare-snoozes');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('medcare-snoozes', JSON.stringify(snoozedAlarms));
    }, [snoozedAlarms]);

    useEffect(() => {
        if (user) {
            setupNativeListeners();
            fetchMeds();
            checkPermission();
        }
    }, [user, selectedPatient]);

    const setupNativeListeners = async () => {
        if (!Capacitor.isNativePlatform()) return;

        // Register action types
        await LocalNotifications.registerActionTypes({
            types: [
                {
                    id: 'MED_ACTIONS',
                    actions: [
                        { id: 'take', title: 'Tomar Agora', foreground: true },
                        { id: 'snooze', title: 'Adiar 10min', foreground: false },
                    ],
                },
            ],
        });

        // Handle notification clicks
        LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
            if (notification.actionId === 'take') {
                // For now, opening the app and showing the modal is safer
                console.log("Action Take performed");
            } else if (notification.actionId === 'snooze') {
                handleSnooze(10);
            }
        });
    };

    useEffect(() => {
        if (isLoaded) {
            checkAlarms();
        }
        const interval = setInterval(() => {
            checkAlarms();
        }, 15000); // Check every 15 seconds for better precision

        return () => clearInterval(interval);
    }, [meds, snoozedAlarms, todayLogs, isLoaded, selectedPatient]);

    const fetchMeds = async () => {
        if (!targetUserId) return;
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const [medsRes, logsRes] = await Promise.all([
            supabase.from('medications').select('*, medication_schedules(*)').eq('user_id', targetUserId),
            supabase.from('medication_logs')
                .select('*, medications!inner(user_id)')
                .eq('medications.user_id', targetUserId)
                .gte('scheduled_time', start.toISOString())
                .lte('scheduled_time', end.toISOString())
        ]);

        if (medsRes.data) {
            setMeds(medsRes.data as any);
            // Only schedule native notifications for OWN meds
            if (Capacitor.isNativePlatform() && !selectedPatient) {
                scheduleNativeNotifications(medsRes.data as any);
            }
        }

        if (logsRes.data) {
            setTodayLogs(logsRes.data);
            // Ensure isLoaded is set only after logs are here to prevent false alarms
            setIsLoaded(true);
        } else {
            setTodayLogs([]);
            setIsLoaded(true);
        }
    };

    const scheduleNativeNotifications = async (medsToSchedule: MedWithSchedules[]) => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            // Cancel existing to avoid duplicates
            await LocalNotifications.cancel({ notifications: (await LocalNotifications.getPending()).notifications });

            const notifications = [];
            let id = 1;

            for (const med of medsToSchedule) {
                if (!med.active) continue;

                for (const schedule of med.medication_schedules) {
                    const [hours, minutes] = schedule.time.split(':').map(Number);
                    const now = new Date();
                    const scheduledDate = new Date();
                    scheduledDate.setHours(hours, minutes, 0, 0);

                    // If time already passed today, schedule for tomorrow (or just ignore for this 24h burst)
                    if (scheduledDate < now) {
                        scheduledDate.setDate(scheduledDate.getDate() + 1);
                    }

                    notifications.push({
                        title: `Hora do seu remédio: ${med.name}`,
                        body: `Dose: ${med.dosage}`,
                        id: id++,
                        schedule: { at: scheduledDate },
                        sound: 'resource://raw/alarm_sound', // Placeholder for native sound
                        smallIcon: 'ic_stat_name', // Needs to be generated
                        actionTypeId: 'MED_ACTIONS',
                    });
                }
            }

            if (notifications.length > 0) {
                await LocalNotifications.schedule({ notifications });
            }
        } catch (e) {
            console.error("Error scheduling native alerts", e);
        }
    };

    const checkPermission = async () => {
        if (Capacitor.isNativePlatform()) {
            const status = await LocalNotifications.checkPermissions();
            setPermissionGranted(status.display === 'granted');
        } else if ('Notification' in window) {
            setPermissionGranted(Notification.permission === 'granted');
        }
    };

    const requestPermission = async () => {
        if (Capacitor.isNativePlatform()) {
            const status = await LocalNotifications.requestPermissions();
            setPermissionGranted(status.display === 'granted');
        } else if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setPermissionGranted(permission === 'granted');
        }
    };

    const checkAlarms = () => {
        if (!isLoaded || ringing || !user) return;

        // Wait at least a few seconds after load to prevent race condition with todayLogs
        const now = new Date();
        const currentMinute = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        if (currentMinute === lastCheckedMinute.current) return;

        const triggering: { med: MedWithSchedules; schedule: MedicationSchedule }[] = [];

        meds.forEach(med => {
            // Only active medications trigger alarms
            if (!med.active) return;

            med.medication_schedules.forEach(schedule => {
                const scheduleTime = schedule.time.slice(0, 5); // HH:mm

                if (scheduleTime <= currentMinute) {
                    const [schedHour, schedMinute] = scheduleTime.split(':').map(Number);
                    const schedDate = new Date();
                    schedDate.setHours(schedHour, schedMinute, 0, 0);

                    // If the alarm is more than 60 minutes old, don't ring anymore (it's missed)
                    const diffMs = now.getTime() - schedDate.getTime();
                    const diffMins = diffMs / 1000 / 60;

                    if (diffMins > 60) return;

                    const isAlreadyTaken = todayLogs.some(l => l.schedule_id === schedule.id && (l.status === 'confirmed' || l.status === 'skipped'));
                    if (isAlreadyTaken) return;

                    const snoozeExpire = snoozedAlarms[schedule.id];
                    if (snoozeExpire && Date.now() < snoozeExpire) return;

                    triggering.push({ med, schedule });
                }
            });
        });

        if (triggering.length > 0) {
            triggerAlarm(triggering);
        }

        lastCheckedMinute.current = currentMinute;
    };

    const triggerAlarm = (alarms: { med: MedWithSchedules; schedule: MedicationSchedule }[]) => {
        setActiveAlarms(alarms);
        setRinging(true);
        setIsMuted(false); // Reset mute when new alarm triggers

        // System notification
        if (Capacitor.isNativePlatform()) {
            // LocalNotifications.schedule is already doing the heavy lifting for background
            // But we can trigger an immediate one if needed (though checkAlarms handles modal)
        } else if (Notification.permission === 'granted') {
            const title = alarms.length === 1
                ? `Hora do seu remédio: ${alarms[0].med.name}`
                : `Hora dos seus remédios (${alarms.length})`;

            const body = alarms.length === 1
                ? `Dose: ${alarms[0].med.dosage} (${alarms[0].schedule.time.slice(0, 5)})`
                : alarms.map(a => `- ${a.med.name}`).join('\n');

            new Notification(title, {
                body,
                icon: '/pwa-192x192.png',
                tag: `med-group-${Date.now()}`,
                requireInteraction: true,
            });
        }

        playAudio();
    };

    const playAudio = () => {
        try {
            if (!audioRef.current) {
                audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audioRef.current.loop = true;
            }
            // Stop medication audio if a panic alert is active
            if (activePanicAlert) {
                audioRef.current.pause();
                return;
            }
            if (!isMuted) {
                audioRef.current.play().catch((err) => {
                    console.log("Audio playback delayed until interaction");
                });
            }
        } catch (e) {
            // Silently fail, user will see the visual alarm
        }
    };

    useEffect(() => {
        if (activePanicAlert && audioRef.current) {
            audioRef.current.pause();
        } else if (!activePanicAlert && ringing && !isMuted) {
            playAudio();
        }
    }, [activePanicAlert]);

    const toggleMute = () => {
        setIsMuted(prev => {
            const next = !prev;
            if (next && audioRef.current) {
                audioRef.current.pause();
            } else if (!next && ringing) {
                playAudio();
            }
            return next;
        });
    };

    const stopAlarm = () => {
        setRinging(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const handleConfirm = async (alarm: { med: MedWithSchedules; schedule: MedicationSchedule }) => {
        if (!user) return;
        const { med, schedule } = alarm;

        try {
            const scheduledTime = new Date();
            const [hours, minutes] = schedule.time.split(':');
            scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const { error } = await supabase.from('medication_logs').insert({
                medication_id: med.id,
                schedule_id: schedule.id,
                scheduled_time: scheduledTime.toISOString(),
                status: 'confirmed',
                taken_at: new Date().toISOString(),
            });

            if (error) throw error;

            if (med.stock_quantity > 0) {
                await supabase.from('medications').update({ stock_quantity: med.stock_quantity - 1 }).eq('id', med.id);
            }

            toast({ title: `${med.name} confirmado!` });

            // Remove from active alarms
            const remaining = activeAlarms.filter(a => a.schedule.id !== schedule.id);
            setActiveAlarms(remaining);

            if (remaining.length === 0) {
                stopAlarm();
            }

            fetchMeds();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao registrar', description: error.message });
        }
    };

    const handleSnooze = async (minutes: number) => {
        if (activeAlarms.length === 0 || !user) return;

        const expire = Date.now() + minutes * 60 * 1000;
        const nextSnoozes = { ...snoozedAlarms };

        for (const alarm of activeAlarms) {
            await supabase.from('medication_snoozes').insert({
                user_id: user.id,
                medication_id: alarm.med.id,
                schedule_id: alarm.schedule.id,
            });

            // Trigger security check (server will count snoozes)
            callSecurityAlert({
                table: 'medication_snoozes',
                record: {
                    user_id: user.id,
                    medication_id: alarm.med.id,
                    schedule_id: alarm.schedule.id
                }
            });

            nextSnoozes[alarm.schedule.id] = expire;
        }

        setSnoozedAlarms(nextSnoozes);
        localStorage.setItem('medcare-snoozes', JSON.stringify(nextSnoozes)); // Immediate sync
        stopAlarm();
        setActiveAlarms([]);
        toast({ title: `${activeAlarms.length > 1 ? 'Alertas adiados' : 'Alerta adiado'} por ${minutes} minutos.` });
    };

    return (
        <AlarmContext.Provider value={{
            requestPermission,
            permissionGranted,
            meds,
            todayLogs,
            refreshData: fetchMeds
        }}>
            {children}

            <Dialog open={ringing} onOpenChange={(open) => !open && stopAlarm()}>
                <DialogContent className="max-w-md border-none bg-background/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden ring-2 ring-primary/20 animate-in zoom-in-95 duration-300">
                    {activeAlarms.length > 0 && (
                        <div className="p-8 text-center space-y-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-primary/5 animate-pulse" />

                            <DialogHeader className="relative flex-row justify-between items-start space-y-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full h-12 w-12 hover:bg-primary/10 text-primary z-10"
                                    onClick={toggleMute}
                                >
                                    {isMuted ? <BellOff className="h-6 w-6" /> : <Bell className="h-6 w-6 animate-swing" />}
                                </Button>

                                <div className="space-y-1 flex-1 text-center pr-12">
                                    <DialogTitle className="text-3xl font-black tracking-tight text-primary">Hora da Dose!</DialogTitle>
                                    <DialogDescription className="text-muted-foreground font-medium">Não esqueça de cuidar de você.</DialogDescription>
                                </div>
                            </DialogHeader>

                            <div className="relative space-y-3 max-h-[40vh] overflow-y-auto px-1">
                                {activeAlarms.map((alarm, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm flex items-center justify-between gap-4 group transition-all hover:bg-primary/10">
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                                                <Pill className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-sm leading-tight">{alarm.med.name}</h3>
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 bg-primary/5 border-primary/20 text-primary font-bold">
                                                        {alarm.schedule.time.slice(0, 5)}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{alarm.med.dosage}</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold shadow-md"
                                            onClick={() => handleConfirm(alarm)}
                                        >
                                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Tomar
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="relative space-y-3 pt-4 border-t border-primary/10">
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        className="h-12 rounded-xl font-bold hover:bg-muted/50 border-primary/20"
                                        onClick={() => handleSnooze(5)}
                                    >
                                        Adiar tudo 5 min
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-12 rounded-xl font-bold hover:bg-muted/50 border-primary/20"
                                        onClick={() => handleSnooze(15)}
                                    >
                                        Adiar tudo 15 min
                                    </Button>
                                </div>
                            </div>

                            <style dangerouslySetInnerHTML={{
                                __html: `
                                @keyframes swing {
                                    0% { transform: rotate(0); }
                                    10% { transform: rotate(10deg); }
                                    30% { transform: rotate(-10deg); }
                                    50% { transform: rotate(5deg); }
                                    70% { transform: rotate(-5deg); }
                                    100% { transform: rotate(0); }
                                }
                                .animate-swing {
                                    animation: swing 2s infinite ease-in-out;
                                    transform-origin: top center;
                                }
                            `}} />

                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">
                                {activeAlarms.length} {activeAlarms.length > 1 ? 'medicamentos pendentes' : 'medicamento pendente'}
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AlarmContext.Provider>
    );
};

export const useAlarm = () => {
    const context = useContext(AlarmContext);
    if (context === undefined) {
        throw new Error('useAlarm must be used within a MedicationAlarmProvider');
    }
    return context;
};
