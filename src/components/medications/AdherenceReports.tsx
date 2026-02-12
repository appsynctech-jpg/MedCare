import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MedicationLog } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export function AdherenceReports({ userId }: { userId: string }) {
    const [logs, setLogs] = useState<MedicationLog[]>([]);
    const [snoozes, setSnoozes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [logsRes, snoozesRes] = await Promise.all([
                supabase
                    .from('medication_logs')
                    .select('*, medications(*)')
                    .order('scheduled_time', { ascending: false })
                    .limit(100),
                supabase
                    .from('medication_snoozes')
                    .select('*, medications(*), medication_schedules(*)')
                    .order('created_at', { ascending: false })
            ]);

            if (logsRes.data) setLogs(logsRes.data as any);
            if (snoozesRes.data) setSnoozes(snoozesRes.data);
            setLoading(false);
        };
        fetchData();
    }, [userId]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    const stats = {
        confirmed: logs.filter(l => l.status === 'confirmed').length,
        missed: logs.filter(l => l.status === 'missed').length,
        skipped: logs.filter(l => l.status === 'skipped').length,
    };

    const total = logs.length || 1;
    const adherenceRate = Math.round((stats.confirmed / total) * 100);

    const pieData = [
        { name: 'Tomados', value: stats.confirmed, color: 'hsl(var(--success))' },
        { name: 'Perdidos', value: stats.missed, color: 'hsl(var(--destructive))' },
        { name: 'Pulados', value: stats.skipped, color: 'hsl(var(--warning))' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Adesão</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="text-3xl font-bold">{adherenceRate}%</div>
                            <TrendingUp className={`h-5 w-5 ${adherenceRate > 80 ? 'text-green-500' : 'text-yellow-500'}`} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Doses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{logs.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Status Geral</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-green-600"><CheckCircle className="h-4 w-4" /> {stats.confirmed} tomados</div>
                            <div className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-4 w-4" /> {stats.missed} perdidos</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="text-base font-semibold">Distribuição de Adesão</CardTitle></CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base font-semibold">Resumo Numérico</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pieData.map((d) => (
                                <div key={d.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="text-sm">{d.name}</span>
                                    </div>
                                    <span className="font-bold">{d.value} ({Math.round((d.value / total) * 100)}%)</span>
                                </div>
                            ))}
                            <div className="pt-4 border-t">
                                <p className="text-xs text-muted-foreground">
                                    * Estatísticas baseadas nos últimos 100 registros de medicamentos.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" /> Análise de Atrasos (Adiamentos)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {snoozes.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Nenhum adiamento registrado até o momento.</p>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Estes medicamentos foram adiados com frequência via alarme. Muitos adiamentos podem indicar dificuldade em seguir o horário proposto.
                            </p>
                            <div className="rounded-xl border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Medicamento</th>
                                            <th className="px-4 py-2 text-left">Horário</th>
                                            <th className="px-4 py-2 text-center">Cliques em "Adiar"</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {Object.values(snoozes.reduce((acc: any, curr) => {
                                            const key = `${curr.medication_id}-${curr.schedule_id}`;
                                            if (!acc[key]) {
                                                acc[key] = {
                                                    name: curr.medications?.name || 'Desconhecido',
                                                    time: curr.medication_schedules?.time?.slice(0, 5) || '--:--',
                                                    count: 0
                                                };
                                            }
                                            acc[key].count++;
                                            return acc;
                                        }, {})).sort((a: any, b: any) => b.count - a.count).map((item: any, i: number) => (
                                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-medium">{item.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.time}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge variant={item.count > 10 ? 'destructive' : 'secondary'} className="rounded-full">
                                                        {item.count} vezes
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
