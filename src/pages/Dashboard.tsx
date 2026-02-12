import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, CalendarDays, FileText, Clock, ArrowRight, CheckCircle, XCircle, AlertTriangle, Bell, UserPlus, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFamily } from '@/hooks/useFamily';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useAlarm } from '@/providers/MedicationAlarmProvider';
import type { Medication, Appointment, MedicationSchedule } from '@/types';

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedPatient, setSelectedPatient, relationships, pendingInvites, refreshFamily } = useFamily();
  const targetUserId = selectedPatient?.id || user?.id;
  const { toast } = useToast();
  const { requestPermission, permissionGranted, meds, todayLogs, refreshData } = useAlarm();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      if (!targetUserId) return;
      setLoading(true);
      const [apptRes, docsRes] = await Promise.all([
        supabase.from('appointments').select('*, doctors(*)').eq('user_id', targetUserId).gte('appointment_date', new Date().toISOString()).order('appointment_date', { ascending: true }).limit(5),
        supabase.from('medical_documents').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId),
      ]);
      if (apptRes.data) setAppointments(apptRes.data as any);
      setDocCount(docsRes.count ?? 0);
      setLoading(false);
    };
    fetchData();
  }, [user, selectedPatient]);

  const nextAppointment = appointments[0];

  const todaySchedules = meds.flatMap((med) =>
    (med.medication_schedules || []).map((s) => ({
      medicationId: med.id,
      scheduleId: s.id,
      medicationName: med.name,
      dosage: med.dosage,
      time: s.time,
      med: med
    }))
  ).sort((a, b) => a.time.localeCompare(b.time));

  const getLogStatus = (scheduleId: string) => todayLogs.find(l => l.schedule_id === scheduleId)?.status;

  const handleLog = async (schedule: any, status: 'confirmed' | 'missed' | 'skipped') => {
    if (!targetUserId) return;
    try {
      const scheduledTime = new Date();
      const [hours, minutes] = schedule.time.split(':');
      scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { error } = await supabase.from('medication_logs').insert({
        medication_id: schedule.medicationId,
        schedule_id: schedule.scheduleId,
        scheduled_time: scheduledTime.toISOString(),
        status,
        taken_at: status === 'confirmed' ? new Date().toISOString() : null,
      });

      if (error) throw error;

      // Update stock if confirmed
      if (status === 'confirmed' && schedule.med.stock_quantity > 0) {
        await supabase.from('medications').update({ stock_quantity: schedule.med.stock_quantity - 1 }).eq('id', schedule.med.id);
      }

      // Trigger security alert if missed or skipped
      if (status === 'missed' || status === 'skipped') {
        await supabase.functions.invoke('send-security-alert', {
          body: {
            type: 'INSERT',
            table: 'medication_logs',
            record: {
              medication_id: schedule.medicationId,
              schedule_id: schedule.scheduleId,
              status: status,
              user_id: user.id
            }
          }
        });
      }

      toast({ title: status === 'confirmed' ? 'Dose registrada!' : 'Status atualizado.' });
      refreshData(); // Refresh global state
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao registrar', description: error.message });
    }
  };

  const handleAcceptInvite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('caregiver_relationships')
        .update({ status: 'accepted' })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Convite aceito!', description: 'Você agora pode monitorar este familiar.' });
      refreshFamily();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao aceitar', description: error.message });
    }
  };

  const handleRejectInvite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('caregiver_relationships')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Convite recusado.' });
      refreshFamily();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao recusar', description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua saúde</p>
      </div>

      {relationships.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
          <button
            onClick={() => setSelectedPatient(null)}
            className={`flex flex-col items-center gap-1.5 transition-all outline-none group`}
          >
            <div className={`h-14 w-14 rounded-full flex items-center justify-center p-0.5 border-2 transition-all ${!selectedPatient ? 'border-primary scale-110 shadow-lg shadow-primary/20' : 'border-transparent hover:border-muted'}`}>
              <div className={`h-full w-full rounded-full flex items-center justify-center font-bold text-lg uppercase transition-all ${!selectedPatient ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-muted/80'}`}>
                {user?.user_metadata?.full_name?.split(' ').map((n: any) => n[0]).slice(0, 2).join('') || 'U'}
              </div>
            </div>
            <span className={`text-[10px] font-medium uppercase tracking-tighter ${!selectedPatient ? 'text-primary' : 'text-muted-foreground'}`}>Você</span>
          </button>

          {relationships.map((rel) => {
            const isSelected = selectedPatient?.id === (rel as any).profiles?.id;
            const initials = (rel as any).profiles?.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'F';
            return (
              <button
                key={rel.id}
                onClick={() => setSelectedPatient((rel as any).profiles)}
                className={`flex flex-col items-center gap-1.5 transition-all outline-none group`}
              >
                <div className={`h-14 w-14 rounded-full flex items-center justify-center p-0.5 border-2 transition-all ${isSelected ? 'border-primary scale-110 shadow-lg shadow-primary/20' : 'border-transparent hover:border-muted'}`}>
                  <div className={`h-full w-full rounded-full flex items-center justify-center font-bold text-lg uppercase transition-all ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-muted/80'}`}>
                    {initials}
                  </div>
                </div>
                <span className={`text-[10px] font-medium uppercase tracking-tighter truncate w-14 text-center ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                  {(rel as any).profiles?.full_name?.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {pendingInvites.length > 0 && (
        <div className="space-y-4">
          {pendingInvites.map((invite) => (
            <Card key={invite.id} className="border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 border-dashed">
              <CardContent className="flex items-center justify-between p-4 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                    <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Novo Convite de Família</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-indigo-700 dark:text-indigo-300">{(invite as any).profiles?.full_name}</span> quer que você monitore a saúde dele(a).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Button size="sm" variant="outline" className="h-8 border-red-200 hover:bg-red-50 text-red-600" onClick={() => handleRejectInvite(invite.id)}>
                    <X className="h-4 w-4 mr-1" /> Recusar
                  </Button>
                  <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleAcceptInvite(invite.id)}>
                    <Check className="h-4 w-4 mr-1" /> Aceitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!permissionGranted && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Ativar Alarmes</p>
                <p className="text-xs text-muted-foreground">Deseja ser notificado no horário dos seus remédios?</p>
              </div>
            </div>
            <Button size="sm" onClick={requestPermission}>Ativar Agora</Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Medicamentos Ativos</CardTitle>
            <Pill className="h-5 w-5 text-[hsl(var(--medication))]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{meds.length}</div>
            <Link to="/medications" className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Próxima Consulta</CardTitle>
            <CalendarDays className="h-5 w-5 text-[hsl(var(--appointment))]" />
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <>
                <div className="text-lg font-bold">
                  {new Date(nextAppointment.appointment_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </div>
                <p className="text-sm text-muted-foreground">
                  {(nextAppointment as any).doctors?.name || 'Médico'} - {(nextAppointment as any).doctors?.specialty || ''}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma consulta agendada</p>
            )}
            <Link to="/appointments" className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
              Ver agenda <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Documentos</CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{docCount}</div>
            <Link to="/documents" className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
              Ver documentos <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Today's Medications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" /> Medicamentos de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySchedules.length > 0 ? (
            <div className="space-y-3">
              {todaySchedules.map((s, i) => (
                <div key={i} className={`flex items-center justify-between rounded-lg border p-3 ${getLogStatus(s.scheduleId) === 'confirmed' ? 'bg-green-50/50 border-green-100' :
                  getLogStatus(s.scheduleId) === 'skipped' ? 'bg-yellow-50/50 border-yellow-100' :
                    getLogStatus(s.scheduleId) === 'missed' ? 'bg-red-50/50 border-red-100' : ''
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getLogStatus(s.scheduleId) === 'confirmed' ? 'bg-green-100 text-green-600' :
                      getLogStatus(s.scheduleId) === 'skipped' ? 'bg-yellow-100 text-yellow-600' :
                        getLogStatus(s.scheduleId) === 'missed' ? 'bg-red-100 text-red-600' :
                          'bg-[hsl(var(--medication))]/10'
                      }`}>
                      {getLogStatus(s.scheduleId) === 'confirmed' ? <CheckCircle className="h-5 w-5" /> :
                        getLogStatus(s.scheduleId) === 'skipped' ? <AlertTriangle className="h-5 w-5" /> :
                          getLogStatus(s.scheduleId) === 'missed' ? <XCircle className="h-5 w-5" /> :
                            <Pill className="h-5 w-5 text-[hsl(var(--medication))]" />}
                    </div>
                    <div>
                      <p className={`font-medium ${getLogStatus(s.scheduleId) === 'confirmed' ? 'text-green-800' :
                        getLogStatus(s.scheduleId) === 'skipped' ? 'text-yellow-800' :
                          getLogStatus(s.scheduleId) === 'missed' ? 'text-red-800' : ''
                        }`}>{s.medicationName}</p>
                      <p className="text-sm text-muted-foreground">{s.dosage}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <Badge variant={getLogStatus(s.scheduleId) ? 'default' : 'outline'} className={`text-xs ${getLogStatus(s.scheduleId) === 'confirmed' ? 'bg-green-500 hover:bg-green-600 text-white border-none' :
                      getLogStatus(s.scheduleId) === 'skipped' ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-none' :
                        getLogStatus(s.scheduleId) === 'missed' ? 'bg-red-500 hover:bg-red-600 text-white border-none' : ''
                      }`}>
                      {getLogStatus(s.scheduleId) === 'confirmed' ? 'Tomado' :
                        getLogStatus(s.scheduleId) === 'skipped' ? 'Pulado' :
                          getLogStatus(s.scheduleId) === 'missed' ? 'Não tomado' :
                            s.time.slice(0, 5)}
                    </Badge>
                    {!getLogStatus(s.scheduleId) && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleLog(s, 'confirmed')}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                          onClick={() => handleLog(s, 'skipped')}>
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleLog(s, 'missed')}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhum medicamento programado para hoje.</p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      {appointments.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Próximas Consultas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/appointments">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments.slice(0, 3).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--appointment))]/10">
                      <CalendarDays className="h-5 w-5 text-[hsl(var(--appointment))]" />
                    </div>
                    <div>
                      <p className="font-medium">{(apt as any).doctors?.name || 'Consulta'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(apt.appointment_date).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(apt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                    {apt.status === 'pending' ? 'Pendente' : apt.status === 'confirmed' ? 'Confirmada' : apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
