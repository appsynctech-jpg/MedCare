import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Plus, Loader2, Stethoscope, Upload, FileText, Trash2, Download } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFamily } from '@/hooks/useFamily';
import type { Appointment, Doctor, MedicalDocument } from '@/types';

const typeLabels: Record<string, string> = { consultation: 'Consulta', exam: 'Exame', return: 'Retorno' };
const statusLabels: Record<string, string> = { pending: 'Pendente', confirmed: 'Confirmada', completed: 'Realizada', cancelled: 'Cancelada' };
const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline', confirmed: 'default', completed: 'secondary', cancelled: 'destructive'
};

const docTypeLabels: Record<string, string> = {
  exam: 'Exame', prescription: 'Receita', report: 'Laudo', vaccine: 'Vacina', certificate: 'Atestado',
};

export default function Appointments() {
  const { user } = useAuth();
  const { selectedPatient } = useFamily();
  const targetUserId = selectedPatient?.id || user?.id;
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<(Appointment & { doctors?: Doctor })[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Detail dialog
  const [detailAppt, setDetailAppt] = useState<(Appointment & { doctors?: Doctor }) | null>(null);
  const [detailNotes, setDetailNotes] = useState('');
  const [detailDocs, setDetailDocs] = useState<MedicalDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState<string>('prescription');
  const [savingNotes, setSavingNotes] = useState(false);

  // Form
  const [doctorId, setDoctorId] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('09:00');
  const [apptType, setApptType] = useState<string>('consultation');
  const [preparations, setPreparations] = useState('');
  const [notes, setNotes] = useState('');
  const [showNewDoctor, setShowNewDoctor] = useState(false);

  // Edit states for detail dialog
  const [editDoctorId, setEditDoctorId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editType, setEditType] = useState('');
  const [editPreparations, setEditPreparations] = useState('');

  const fetchData = useCallback(async () => {
    if (!targetUserId) return;
    const [apptRes, docRes] = await Promise.all([
      supabase.from('appointments').select('*, doctors(*)').eq('user_id', targetUserId).order('appointment_date', { ascending: true }),
      supabase.from('doctors').select('*').eq('user_id', targetUserId),
    ]);
    setAppointments((apptRes.data as any) || []);
    setDoctors((docRes.data as any) || []);
    setLoading(false);
  }, [targetUserId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchApptDocs = async (appointmentId: string) => {
    const { data } = await supabase.from('medical_documents').select('*').eq('appointment_id', appointmentId).order('created_at', { ascending: false });
    setDetailDocs((data as any) || []);
  };

  const openDetail = (apt: Appointment & { doctors?: Doctor }) => {
    setDetailAppt(apt);
    setDetailNotes(apt.notes || '');
    setEditDoctorId(apt.doctor_id || '');
    setEditType(apt.type);
    setEditPreparations(apt.preparations || '');

    if (apt.appointment_date) {
      const d = new Date(apt.appointment_date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setEditDate(`${year}-${month}-${day}`);

      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      setEditTime(`${hours}:${minutes}`);
    }

    fetchApptDocs(apt.id);
  };

  const handleUpdate = async () => {
    if (!detailAppt) return;
    const isPast = new Date(detailAppt.appointment_date) < new Date();
    setSavingNotes(true);
    try {
      const updateData: any = {
        notes: detailNotes,
        preparations: editPreparations || null,
      };

      if (!isPast) {
        updateData.doctor_id = editDoctorId || null;
        updateData.type = editType;
        if (editDate && editTime) {
          // Usar o construtor New Date(string) sem o Z trata como local
          updateData.appointment_date = new Date(`${editDate}T${editTime}:00`).toISOString();
        }
      }

      const { error } = await supabase.from('appointments').update(updateData).eq('id', detailAppt.id);
      if (error) throw error;

      toast({ title: 'Alterações salvas!' });
      fetchData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDocUpload = async (files: FileList | null) => {
    if (!files || !targetUserId || !detailAppt) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024;
    setUploadingDoc(true);
    try {
      for (const file of Array.from(files).slice(0, 5)) {
        if (!allowed.includes(file.type)) {
          toast({ variant: 'destructive', title: `Formato não suportado: ${file.name}` });
          continue;
        }
        if (file.size > maxSize) {
          toast({ variant: 'destructive', title: `Arquivo muito grande: ${file.name}` });
          continue;
        }
        const path = `${targetUserId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('medical-documents').upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('medical-documents').getPublicUrl(path);
        console.log('Document public URL:', urlData.publicUrl);
        await supabase.from('medical_documents').insert({
          user_id: targetUserId,
          appointment_id: detailAppt.id,
          doctor_id: detailAppt.doctor_id || null,
          type: docType,
          title: file.name.replace(/\.[^.]+$/, ''),
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          document_date: new Date().toISOString().split('T')[0],
        });
      }
      toast({ title: 'Documentos anexados!' });
      fetchApptDocs(detailAppt.id);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro no upload', description: error.message });
    } finally {
      setUploadingDoc(false);
    }
  };

  const deleteDoc = async (doc: MedicalDocument) => {
    await supabase.from('medical_documents').delete().eq('id', doc.id);
    if (detailAppt) fetchApptDocs(detailAppt.id);
    toast({ title: 'Documento excluído' });
  };

  const handleSave = async () => {
    if (!targetUserId) return;
    setSaving(true);
    try {
      let finalDoctorId = doctorId;
      if (showNewDoctor && newDoctorName && newDoctorSpecialty) {
        const { data: doc, error } = await supabase.from('doctors').insert({
          user_id: targetUserId, name: newDoctorName, specialty: newDoctorSpecialty,
        }).select().single();
        if (error) throw error;
        finalDoctorId = doc.id;
      }
      if (!apptDate || !apptTime) {
        toast({ variant: 'destructive', title: 'Preencha data e hora' });
        setSaving(false);
        return;
      }
      const appointmentDate = new Date(`${apptDate}T${apptTime}:00`).toISOString();
      const { error } = await supabase.from('appointments').insert({
        user_id: targetUserId, doctor_id: finalDoctorId || null,
        appointment_date: appointmentDate, type: apptType,
        preparations: preparations || null, notes: notes || null,
      });
      if (error) throw error;
      toast({ title: 'Consulta agendada!' });
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('appointments').update({ status }).eq('id', id);
    fetchData();
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const upcoming = appointments.filter((a) => new Date(a.appointment_date) >= new Date() && a.status !== 'cancelled');
  const past = appointments.filter((a) => new Date(a.appointment_date) < new Date() || a.status === 'completed');
  const appointmentDates = appointments.map((a) => new Date(a.appointment_date));

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const renderApptCard = (apt: Appointment & { doctors?: Doctor }, isPast = false) => (
    <Card key={apt.id} className={isPast ? 'opacity-75' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isPast ? 'bg-muted' : 'bg-[hsl(var(--appointment))]/10'}`}>
              <Stethoscope className={`h-6 w-6 ${isPast ? 'text-muted-foreground' : 'text-[hsl(var(--appointment))]'}`} />
            </div>
            <div>
              <p className="font-medium">{apt.doctors?.name || 'Médico não informado'}</p>
              <p className="text-sm text-muted-foreground">{apt.doctors?.specialty}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <CalendarDays className="h-3 w-3" />
                {new Date(apt.appointment_date).toLocaleDateString('pt-BR')} às{' '}
                {new Date(apt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <Badge>{typeLabels[apt.type]}</Badge>
              <Badge variant={statusVariant[apt.status]}>{statusLabels[apt.status]}</Badge>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => openDetail(apt)}>Detalhes</Button>
              {!isPast && apt.status === 'pending' && (
                <Button size="sm" variant="outline" onClick={() => updateStatus(apt.id, 'confirmed')}>Confirmar</Button>
              )}
              {!isPast && (
                <Button size="sm" variant="outline" onClick={() => updateStatus(apt.id, 'completed')}>Realizada</Button>
              )}
              {!isPast && (
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus(apt.id, 'cancelled')}>Cancelar</Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Consultas</h1>
          <p className="text-muted-foreground">Gerencie suas consultas médicas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Agendar Consulta</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova Consulta</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Médico</Label>
                {!showNewDoctor ? (
                  <>
                    <Select value={doctorId} onValueChange={setDoctorId}>
                      <SelectTrigger><SelectValue placeholder="Selecione um médico" /></SelectTrigger>
                      <SelectContent>
                        {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} - {d.specialty}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="link" size="sm" className="p-0" onClick={() => setShowNewDoctor(true)}>+ Cadastrar novo médico</Button>
                  </>
                ) : (
                  <div className="space-y-2 rounded-lg border p-3">
                    <Input placeholder="Nome do médico" value={newDoctorName} onChange={(e) => setNewDoctorName(e.target.value)} />
                    <Input placeholder="Especialidade" value={newDoctorSpecialty} onChange={(e) => setNewDoctorSpecialty(e.target.value)} />
                    <Button variant="link" size="sm" className="p-0" onClick={() => setShowNewDoctor(false)}>Selecionar existente</Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input type="time" value={apptTime} onChange={(e) => setApptTime(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={apptType} onValueChange={setApptType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consulta</SelectItem>
                    <SelectItem value="exam">Exame</SelectItem>
                    <SelectItem value="return">Retorno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preparos necessários</Label>
                <Textarea value={preparations} onChange={(e) => setPreparations(e.target.value)} placeholder="Ex: Jejum de 12h" />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações" />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card>
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{ appointment: appointmentDates }}
              modifiersClassNames={{ appointment: 'bg-primary/20 font-bold text-primary' }}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Próximas ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Histórico ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {upcoming.length === 0 ? (
              <Card className="p-8 text-center">
                <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhuma consulta agendada</p>
              </Card>
            ) : (
              upcoming.map((apt) => renderApptCard(apt))
            )}
          </TabsContent>
          <TabsContent value="past" className="space-y-3 mt-4">
            {past.map((apt) => renderApptCard(apt, true))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailAppt} onOpenChange={(open) => { if (!open) setDetailAppt(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Consulta</DialogTitle>
          </DialogHeader>
          {detailAppt && (
            <div className="space-y-6">
              {/* Edit Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Médico</Label>
                  <Select
                    value={editDoctorId}
                    onValueChange={setEditDoctorId}
                    disabled={new Date(detailAppt.appointment_date) < new Date()}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione um médico" /></SelectTrigger>
                    <SelectContent>
                      {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} — {d.specialty}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={editType}
                    onValueChange={setEditType}
                    disabled={new Date(detailAppt.appointment_date) < new Date()}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consulta</SelectItem>
                      <SelectItem value="exam">Exame</SelectItem>
                      <SelectItem value="return">Retorno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    disabled={new Date(detailAppt.appointment_date) < new Date()}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    disabled={new Date(detailAppt.appointment_date) < new Date()}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preparos</Label>
                <Input
                  value={editPreparations}
                  onChange={(e) => setEditPreparations(e.target.value)}
                  placeholder="Ex: Jejum"
                />
              </div>

              {/* Notes / Description */}
              <div className="space-y-2">
                <Label>Anotações da Consulta</Label>
                <Textarea
                  value={detailNotes}
                  onChange={(e) => setDetailNotes(e.target.value)}
                  placeholder="Descreva o que foi discutido na consulta, diagnósticos, orientações..."
                  className="min-h-[120px]"
                />
                <Button className="w-full" onClick={handleUpdate} disabled={savingNotes}>
                  {savingNotes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Alterações
                </Button>
              </div>

              {/* Document Upload */}
              <div className="space-y-3">
                <Label>Documentos Anexados</Label>
                <div className="flex items-center gap-3">
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(docTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" disabled={uploadingDoc} onClick={() => document.getElementById('appt-doc-upload')?.click()}>
                    {uploadingDoc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Anexar Arquivo
                  </Button>
                  <input id="appt-doc-upload" type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleDocUpload(e.target.files)} />
                </div>

                {detailDocs.length > 0 ? (
                  <div className="space-y-2">
                    {detailDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.title}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{docTypeLabels[doc.type] || doc.type}</Badge>
                              <span>{formatSize(doc.file_size)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteDoc(doc)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
