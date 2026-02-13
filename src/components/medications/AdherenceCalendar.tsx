import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MedicationLog } from '@/types';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AdherenceCalendar({ userId, externalLogs }: { userId?: string, externalLogs?: MedicationLog[] }) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [logs, setLogs] = useState<MedicationLog[]>(externalLogs || []);
    const [loading, setLoading] = useState(!externalLogs);

    const fetchLogs = async (currentDate: Date) => {
        if (externalLogs) return; // Se temos logs externos, não buscamos
        if (!userId) return;
        setLoading(true);
        const start = startOfMonth(currentDate).toISOString();
        const end = endOfMonth(currentDate).toISOString();

        const { data, error } = await supabase
            .from('medication_logs')
            .select('*, medications!inner(name, user_id)')
            .eq('medications.user_id', userId)
            .gte('scheduled_time', start)
            .lte('scheduled_time', end);

        if (!error && data) {
            setLogs(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (date) fetchLogs(date);
    }, [date?.getMonth()]);

    const getDayStatus = (day: Date) => {
        const dayLogs = logs.filter(l => isSameDay(new Date(l.scheduled_time), day));
        if (dayLogs.length === 0) return null;

        const hasMissed = dayLogs.some(l => l.status === 'missed');
        const hasSkipped = dayLogs.some(l => l.status === 'skipped');
        const allConfirmed = dayLogs.every(l => l.status === 'confirmed');

        if (hasMissed) return 'missed';
        if (allConfirmed) return 'confirmed';
        if (hasSkipped) return 'partial';
        return 'partial';
    };

    const modifiers = {
        confirmed: (day: Date) => getDayStatus(day) === 'confirmed',
        missed: (day: Date) => getDayStatus(day) === 'missed',
        partial: (day: Date) => getDayStatus(day) === 'partial',
    };

    const modifiersStyles = {
        confirmed: { backgroundColor: 'hsl(var(--success))', color: 'white' },
        missed: { backgroundColor: 'hsl(var(--destructive))', color: 'white' },
        partial: { backgroundColor: 'hsl(var(--warning))', color: 'black' },
    };

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>Calendário de Adesão</span>
                    <div className="flex gap-2 text-xs font-normal">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[hsl(var(--success))]" /> Tudo Ok</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[hsl(var(--destructive))]" /> Pendente</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[hsl(var(--warning))]" /> Parcial</div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="border rounded-md p-2">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                modifiers={modifiers}
                                modifiersStyles={modifiersStyles}
                                className="rounded-md"
                            />
                        </div>

                        <div className="flex-1 space-y-4">
                            <h3 className="font-semibold text-sm">Resumo do dia: {date ? format(date, 'dd/MM/yyyy') : '-'}</h3>
                            <div className="space-y-2">
                                {logs.filter(l => isSameDay(new Date(l.scheduled_time), date || new Date())).length === 0 ? (
                                    <p className="text-sm text-muted-foreground whitespace-nowrap">Nenhum registro para este dia.</p>
                                ) : (
                                    logs.filter(l => isSameDay(new Date(l.scheduled_time), date || new Date())).map(log => (
                                        <div key={log.id} className="flex items-center justify-between p-2 rounded-lg border text-sm">
                                            <div className="flex items-center gap-2">
                                                {log.status === 'confirmed' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                                                    log.status === 'missed' ? <XCircle className="h-4 w-4 text-red-500" /> :
                                                        <AlertCircle className="h-4 w-4 text-yellow-500" />}
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{log.medications?.name}</span>
                                                    <span className="text-xs text-muted-foreground">{new Date(log.scheduled_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                            <Badge variant={log.status === 'confirmed' ? 'default' : log.status === 'missed' ? 'destructive' : 'outline'}>
                                                {log.status === 'confirmed' ? 'Tomado' : log.status === 'missed' ? 'Não tomado' : 'Pulado'}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
