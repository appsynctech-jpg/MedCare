import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Users, Crown, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Total Users and Plans
                const { data: plans } = await supabase
                    .from('profiles')
                    .select('subscription_plan');

                const totalUsers = plans?.length || 0;
                const proUsers = plans?.filter(p => p.subscription_plan === 'pro').length || 0;
                const freeUsers = totalUsers - proUsers;

                // 2. Subscription Statuses
                const { data: subs } = await supabase
                    .from('subscriptions')
                    .select('status');

                const activeSubs = subs?.filter(s => s.status === 'active' || s.status === 'trial').length || 0;
                const canceledSubs = subs?.filter(s => s.status === 'canceled' || s.status === 'expired').length || 0;

                // 3. System Activity
                const { count: panicCount } = await supabase
                    .from('panic_logs')
                    .select('*', { count: 'exact', head: true });

                const { count: medCount } = await supabase
                    .from('medications')
                    .select('*', { count: 'exact', head: true });

                setStats({
                    summary: [
                        { label: 'Total Usuários', value: totalUsers, icon: Users, color: 'text-blue-500' },
                        { label: 'Assinaturas PRO', value: proUsers, icon: Crown, color: 'text-yellow-500' },
                        { label: 'Alertas Pânico', value: panicCount || 0, icon: AlertTriangle, color: 'text-red-500' },
                        { label: 'Medicamentos', value: medCount || 0, icon: CheckCircle2, color: 'text-green-500' },
                    ],
                    planData: [
                        { name: 'PRO', value: proUsers, color: '#eab308' },
                        { name: 'Free', value: freeUsers, color: '#94a3b8' },
                    ],
                    statusData: [
                        { name: 'Ativos', value: activeSubs, color: '#22c55e' },
                        { name: 'Cancelados', value: canceledSubs, color: '#ef4444' },
                    ]
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
                <p className="text-muted-foreground">Métricas de uso e desempenho da plataforma MedCare.</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.summary.map((item: any) => (
                    <Card key={item.label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{item.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* User Funnel Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Funil de Usuários</CardTitle>
                        <CardDescription>Distribuição de planos e conversão.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.planData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {stats.planData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Subscription Health Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Saúde das Assinaturas</CardTitle>
                        <CardDescription>Ativos vs Cancelados.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.statusData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.statusData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center">
                            <TrendingUp className="h-6 w-6 text-green-500 mb-1" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest leading-none">Status</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
