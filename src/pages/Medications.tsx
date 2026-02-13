import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdherenceCalendar } from '@/components/medications/AdherenceCalendar';
import { AdherenceReports } from '@/components/medications/AdherenceReports';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Pill, Plus, AlertTriangle, Clock, Loader2, Camera, Image, X, CheckCircle, AlertCircle, XCircle, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFamily } from '@/hooks/useFamily';
import type { Medication, MedicationSchedule } from '@/types';
import { useAlarm } from '@/providers/MedicationAlarmProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';

type MedWithSchedules = Medication & { medication_schedules: MedicationSchedule[] };

const formOptions = [
  { value: 'comprimido', label: 'Comprimido' },
  { value: 'capsula', label: 'Cápsula' },
  { value: 'xarope', label: 'Xarope' },
  { value: 'gotas', label: 'Gotas' },
  { value: 'injecao', label: 'Injeção' },
  { value: 'pomada', label: 'Pomada' },
];

export default function Medications() {
  const { user } = useAuth();
  const { selectedPatient } = useFamily();
  const targetUserId = selectedPatient?.id || user?.id;
  const { toast } = useToast();
  const { meds, todayLogs, refreshData } = useAlarm();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMed, setDetailMed] = useState<MedWithSchedules | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [doseAmount, setDoseAmount] = useState('');
  const [form, setForm] = useState('comprimido');
  const [manufacturer, setManufacturer] = useState('');
  const [frequency, setFrequency] = useState(1);
  const [schedules, setSchedules] = useState<string[]>(['08:00']);
  const [stock, setStock] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [continuous, setContinuous] = useState(true);
  const [instructions, setInstructions] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Data fetching is now handled by the MedicationAlarmProvider
  // We just need to ensure doc access is filtered correctly if needed
  useEffect(() => {
    // Initial fetch handled by provider
  }, [user]);

  const handleFrequencyChange = (val: string) => {
    const freq = parseInt(val);
    setFrequency(freq);
    const defaults = ['08:00', '12:00', '16:00', '20:00', '10:00', '22:00'];
    setSchedules(prev => {
      if (freq > prev.length) {
        return [...prev, ...defaults.slice(prev.length, freq)];
      }
      return prev.slice(0, freq);
    });
  };

  const removeSchedule = (index: number) => {
    if (schedules.length <= 1) {
      toast({ variant: 'destructive', title: 'Aviso', description: 'O medicamento deve ter pelo menos um horário.' });
      return;
    }
    const newSchedules = schedules.filter((_, i) => i !== index);
    setSchedules(newSchedules);
    setFrequency(newSchedules.length);
  };

  const resetForm = () => {
    setName(''); setDosage(''); setDoseAmount(''); setForm('comprimido'); setManufacturer('');
    setFrequency(1); setSchedules(['08:00']); setStock(0);
    setStartDate(new Date().toISOString().split('T')[0]); setEndDate('');
    setContinuous(true); setInstructions('');
    setPhotoFile(null); setPhotoPreview(null);
    setIsEditing(false); setSelectedMedId(null);
  };

  const openEdit = (med: MedWithSchedules) => {
    setIsEditing(true);
    setSelectedMedId(med.id);
    setName(med.name);
    setDosage(med.dosage);
    setDoseAmount(med.dose_amount || '');
    setForm(med.form || 'comprimido');
    setManufacturer(med.manufacturer || '');
    setFrequency(med.daily_frequency);
    const uniqueSchedules = Array.from(new Set(med.medication_schedules.map(s => s.time.slice(0, 5))));
    setSchedules(uniqueSchedules);
    setFrequency(uniqueSchedules.length);
    setStock(med.stock_quantity);
    setStartDate(med.start_date);
    setEndDate(med.end_date || '');
    setContinuous(!med.end_date);
    setInstructions(med.instructions || '');
    setPhotoPreview(med.photo_url);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !name || !dosage) {
      toast({ variant: 'destructive', title: 'Preencha nome e dosagem' });
      return;
    }
    setSaving(true);
    try {
      let photoUrl = photoPreview;
      if (photoFile && targetUserId) {
        const path = `${targetUserId}/med_${Date.now()}_${photoFile.name}`;
        const { error: upErr } = await supabase.storage.from('medical-documents').upload(path, photoFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('medical-documents').getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      const medData = {
        user_id: targetUserId,
        name, dosage, form, manufacturer: manufacturer || null,
        daily_frequency: frequency, stock_quantity: stock,
        start_date: startDate, end_date: continuous ? null : endDate || null,
        instructions: instructions || null,
        photo_url: photoUrl,
        dose_amount: doseAmount || null,
      };

      let medId = selectedMedId;

      if (isEditing && selectedMedId) {
        const { error: updateErr } = await supabase.from('medications').update(medData).eq('id', selectedMedId);
        if (updateErr) throw updateErr;

        // Update schedules: try to delete old ones
        const { error: deleteErr } = await supabase.from('medication_schedules').delete().eq('medication_id', selectedMedId);
        if (deleteErr) {
          console.error("Delete schedules error:", deleteErr);
          throw new Error("Não foi possível atualizar os horários. Verifique se existem registros vinculados.");
        }
      } else {
        const { data: med, error: insertErr } = await supabase.from('medications').insert(medData).select().single();
        if (insertErr) throw insertErr;
        medId = med.id;
      }

      if (medId) {
        // Ensure unique times only
        const uniqueTimes = Array.from(new Set(schedules));
        const scheduleInserts = uniqueTimes.map((time) => ({
          medication_id: medId,
          time,
        }));
        const { error: scheduleErr } = await supabase.from('medication_schedules').insert(scheduleInserts);
        if (scheduleErr) throw scheduleErr;
      }

      toast({ title: isEditing ? 'Medicamento atualizado!' : 'Medicamento adicionado!' });
      setDialogOpen(false);
      resetForm();
      refreshData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (med: Medication) => {
    await supabase.from('medications').update({ active: !med.active }).eq('id', med.id);
    refreshData();
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [medToDelete, setMedToDelete] = useState<Medication | null>(null);

  const handleDeletePermanent = async () => {
    if (!medToDelete) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('medications').delete().eq('id', medToDelete.id);
      if (error) throw error;
      toast({ title: 'Medicamento excluído permanentemente.' });
      refreshData();
      setDeleteDialogOpen(false);
      setMedToDelete(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const getLogStatus = (scheduleId: string) => todayLogs.find(l => l.schedule_id === scheduleId)?.status;

  const handleLog = async (med: MedWithSchedules, schedule: MedicationSchedule) => {
    if (!targetUserId) return;
    // Check if already taken to prevent double logging
    if (todayLogs.some(l => l.schedule_id === schedule.id)) {
      toast({ title: 'Esta dose já foi registrada hoje.' });
      return;
    }

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

      // Update stock
      if (med.stock_quantity > 0) {
        await supabase.from('medications').update({ stock_quantity: med.stock_quantity - 1 }).eq('id', med.id);
      }

      toast({ title: 'Dose registrada com sucesso!' });
      refreshData();
      setDetailOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao registrar', description: error.message });
    }
  };

  const filtered = meds.filter((m) =>
    filter === 'all' ? true : filter === 'active' ? m.active : !m.active
  );

  const getDaysLeft = (med: Medication) => {
    if (med.form === 'xarope' || med.form === 'gotas' || med.form === 'injecao') return Infinity;
    if (!med.daily_frequency) return Infinity;
    return Math.floor(med.stock_quantity / med.daily_frequency);
  };

  const getTreatmentDaysLeft = (med: Medication) => {
    if (!med.end_date) return null;
    const end = new Date(med.end_date);
    const now = new Date();
    end.setHours(23, 59, 59, 999); // End of the end date
    now.setHours(0, 0, 0, 0); // Start of today

    if (end < now) return 0;

    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus Medicamentos</h1>
          <p className="text-muted-foreground">Gerencie seus medicamentos e horários</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Adicionar Medicamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Medicamento' : 'Novo Medicamento'}</DialogTitle>
              <DialogDescription>
                Preencha os dados do medicamento abaixo. Clique em salvar quando terminar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Paracetamol" />
                </div>
                <div className="space-y-2">
                  <Label>Dosagem (Concentração) *</Label>
                  <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Ex: 500mg" />
                </div>
              </div>

              {(form === 'xarope' || form === 'gotas' || form === 'injecao') && (
                <div className="space-y-2">
                  <Label>Quantidade por dose *</Label>
                  <Input
                    value={doseAmount}
                    onChange={(e) => setDoseAmount(e.target.value)}
                    placeholder={form === 'gotas' ? "Ex: 20 gotas" : "Ex: 5ml"}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forma</Label>
                  <Select value={form} onValueChange={setForm}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {formOptions.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fabricante</Label>
                  <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Opcional" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Frequência diária</Label>
                <Select value={String(frequency)} onValueChange={handleFrequencyChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((n) => <SelectItem key={n} value={String(n)}>{n}x ao dia</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horários</Label>
                <div className="grid grid-cols-2 gap-3">
                  {schedules.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <Input type="time" value={s}
                          className="pr-8"
                          onChange={(e) => { const ns = [...schedules]; ns[i] = e.target.value; setSchedules(ns); }}
                        />
                        <Clock className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                        onClick={() => removeSchedule(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 border-dashed border-2 hover:border-primary hover:text-primary transition-all rounded-xl col-span-2"
                    onClick={() => {
                      setSchedules([...schedules, '08:00']);
                      setFrequency(schedules.length + 1);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Horário
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(form !== 'xarope' && form !== 'gotas' && form !== 'injecao') && (
                  <div className="space-y-2">
                    <Label>Estoque (unidades)</Label>
                    <Input type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Início do Tratamento</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="continuous" checked={continuous} onChange={(e) => setContinuous(e.target.checked)} className="rounded" />
                <Label htmlFor="continuous">Tratamento contínuo</Label>
              </div>
              {!continuous && (
                <div className="space-y-2">
                  <Label>Fim do Tratamento</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              )}
              {/* Photo upload */}
              <div className="space-y-2">
                <Label>Foto do Medicamento</Label>
                {photoPreview ? (
                  <div className="relative w-full">
                    <img src={photoPreview} alt="Preview" className="w-full h-40 object-contain rounded-lg border bg-muted" />
                    <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => document.getElementById('med-photo')?.click()}>
                      <Image className="mr-2 h-4 w-4" /> Galeria
                    </Button>
                    <Button type="button" variant="outline" className="flex-1" onClick={() => document.getElementById('med-camera')?.click()}>
                      <Camera className="mr-2 h-4 w-4" /> Câmera
                    </Button>
                    <input id="med-photo" type="file" className="hidden" accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
                      }} />
                    <input id="med-camera" type="file" className="hidden" accept="image/*" capture="environment"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
                      }} />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Instruções especiais</Label>
                <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Ex: Tomar com alimentos" />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6 mt-6">
          {/* Filters - Improved with Tabs UI style */}
          <div className="flex bg-muted/30 p-1 rounded-xl w-fit gap-1 mb-2">
            {(['active', 'inactive', 'all'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                className={`rounded-lg px-6 h-9 ${filter === f ? 'shadow-sm bg-background hover:bg-background text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
                onClick={() => setFilter(f)}
              >
                {f === 'active' ? 'Ativos' : f === 'inactive' ? 'Inativos' : 'Todos'}
              </Button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Card className="p-12 text-center border-dashed bg-muted/5 flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted/10">
                <Pill className="h-12 w-12 text-muted-foreground/30" />
              </div>
              <div>
                <p className="text-lg font-medium text-muted-foreground">
                  {filter === 'active' ? 'Nenhum medicamento ativo' : filter === 'inactive' ? 'Nenhum medicamento inativo' : 'Nenhum medicamento encontrado'}
                </p>
                <p className="text-sm text-muted-foreground/60">
                  {filter === 'active' ? 'Seus medicamentos em uso aparecerão aqui.' : filter === 'inactive' ? 'Medicamentos que você inativou ficarão guardados aqui.' : 'Comece adicionando seu primeiro remédio.'}
                </p>
              </div>
              {filter !== 'inactive' && (
                <Button className="mt-2" onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Adicionar Medicamento</Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((med) => {
                const daysLeft = getDaysLeft(med);
                return (
                  <Card key={med.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <div className="flex items-center gap-3">
                        {med.photo_url ? (
                          <img
                            src={med.photo_url}
                            alt={med.name}
                            className="h-10 w-10 rounded-full object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => { setDetailMed(med); setDetailOpen(true); }}
                          />
                        ) : (
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--medication))]/10 cursor-pointer hover:bg-[hsl(var(--medication))]/20 transition-colors"
                            onClick={() => { setDetailMed(med); setDetailOpen(true); }}
                          >
                            <Pill className="h-5 w-5 text-[hsl(var(--medication))]" />
                          </div>
                        )}
                        <div className="cursor-pointer flex-1" onClick={() => { setDetailMed(med); setDetailOpen(true); }}>
                          <CardTitle className="text-base">{med.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{med.dosage}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant={med.active ? 'default' : 'secondary'} className={!med.active ? 'opacity-70' : ''}>
                          {med.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <div className="flex gap-1">
                          {!med.active && (
                            <>
                              <Button variant="ghost" size="sm" className="h-8 text-xs px-2 text-primary" onClick={(e) => { e.stopPropagation(); toggleActive(med); }}>
                                Reativar
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 text-xs px-2 text-destructive" onClick={(e) => { e.stopPropagation(); setMedToDelete(med); setDeleteDialogOpen(true); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {med.medication_schedules?.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{med.medication_schedules.map((s) => s.time.slice(0, 5)).join(', ')}</span>
                        </div>
                      )}
                      {daysLeft <= 7 && med.active && daysLeft !== Infinity && (
                        <div className={`flex items-center gap-2 text-sm ${daysLeft <= 3 ? 'text-destructive' : 'text-orange-500'}`}>
                          <AlertTriangle className="h-4 w-4" />
                          <span>{daysLeft <= 3 ? 'URGENTE: ' : ''}Restam {daysLeft} dias</span>
                        </div>
                      )}
                      {getTreatmentDaysLeft(med) !== null && med.active && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                          <Calendar className="h-4 w-4" />
                          <span>Faltam {getTreatmentDaysLeft(med)} dias de tratamento</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="gap-2">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => toggleActive(med)}>
                        {med.active ? 'Pausar Tratamento' : 'Retomar Tratamento'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <AdherenceCalendar userId={targetUserId || ''} />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <AdherenceReports userId={targetUserId || ''} />
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md border-none bg-background/80 backdrop-blur-xl shadow-2xl overflow-hidden p-0">
          {detailMed && (
            <div className="relative">
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />

              <div className="relative p-6 space-y-6">
                <DialogHeader className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-full bg-primary/10 block sm:hidden">
                      <Pill className="h-4 w-4 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold tracking-tight">{detailMed.name}</DialogTitle>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-muted border text-xs">{detailMed.form}</span>
                    <span>•</span>
                    <span className="text-primary/80">{detailMed.dosage}</span>
                  </p>
                </DialogHeader>

                {detailMed.photo_url && (
                  <div className="relative group overflow-hidden rounded-2xl border bg-black/5 dark:bg-white/5 shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    <img
                      src={detailMed.photo_url}
                      alt={detailMed.name}
                      className="h-48 w-full object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                )}

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-muted/30 border border-white/10 flex flex-col gap-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Fabricante</p>
                      <p className="text-sm font-semibold truncate">{detailMed.manufacturer || 'Não informado'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-white/10 flex flex-col gap-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Estoque</p>
                      <p className={`text-sm font-semibold ${getDaysLeft(detailMed) <= 3 ? 'text-destructive' : 'text-primary'}`}>
                        {detailMed.stock_quantity} <span className="text-xs font-normal text-muted-foreground">unid.</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary" /> Próximas Doses
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {detailMed.medication_schedules.map((s) => (
                        <div
                          key={s.id}
                          className="group flex items-center justify-between gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-muted/40 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
                        >
                          <span className="text-sm font-black tracking-tight">{s.time.slice(0, 5)}</span>
                          {getLogStatus(s.id) ? (
                            <Badge variant="secondary" className={`h-8 py-0 px-4 rounded-full flex items-center gap-1.5 font-bold text-xs shadow-sm ${getLogStatus(s.id) === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                              getLogStatus(s.id) === 'skipped' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' :
                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                              }`}>
                              {getLogStatus(s.id) === 'confirmed' ? <CheckCircle className="h-3.5 w-3.5" /> :
                                getLogStatus(s.id) === 'skipped' ? <AlertTriangle className="h-3.5 w-3.5" /> :
                                  <XCircle className="h-3.5 w-3.5" />}
                              {getLogStatus(s.id) === 'confirmed' ? 'Tomado' :
                                getLogStatus(s.id) === 'skipped' ? 'Pulado' : 'Não tomado'}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              className="h-8 rounded-full px-4 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm text-xs font-bold transition-transform active:scale-95"
                              onClick={() => handleLog(detailMed, s)}
                            >
                              <CheckCircle className="mr-1.5 h-3 w-3" /> Tomar
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {detailMed.instructions && (
                    <div className="relative p-4 rounded-xl bg-primary/5 border border-primary/10 overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10">
                        <AlertTriangle className="h-12 w-12" />
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-primary/70 font-black mb-1">Instruções de Uso</p>
                      <p className="text-sm italic leading-relaxed text-foreground/90 font-medium">
                        "{detailMed.instructions}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 rounded-xl h-11 font-bold text-xs uppercase tracking-widest hover:bg-muted/50" onClick={() => setDetailOpen(false)}>
                    Fechar
                  </Button>
                  <Button className="flex-1 rounded-xl h-11 font-bold text-xs uppercase tracking-widest bg-foreground text-background hover:opacity-90 transition-opacity shadow-lg" onClick={() => { setDetailOpen(false); openEdit(detailMed); }}>
                    Editar Dados
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-destructive/20 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Excluir Permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-foreground/80 space-y-3 pt-2 text-sm">
                <p>Esta ação é <strong>irreversível</strong>.</p>
                <p>Você perderá todo o histórico de doses, registros de adesão e horários associados ao medicamento <strong>{medToDelete?.name}</strong>.</p>
                <div className="bg-destructive/5 p-3 rounded-xl border border-destructive/10 text-xs text-destructive flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Os dados não poderão ser recuperados após a confirmação.</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePermanent}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold px-8"
              disabled={saving}
            >
              Excluir Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
