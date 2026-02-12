import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Upload, Download, Trash2, Search, Loader2, File, Image, Stethoscope, CalendarDays } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFamily } from '@/hooks/useFamily';
import type { MedicalDocument } from '@/types';

interface DocWithAppt extends MedicalDocument {
  appointments?: {
    appointment_date: string;
    type: string;
    doctors?: { name: string; specialty: string } | null;
  } | null;
}

const typeLabels: Record<string, string> = {
  exam: 'Exame', prescription: 'Receita', report: 'Laudo', vaccine: 'Vacina', certificate: 'Atestado',
};
const typeColors: Record<string, string> = {
  exam: 'bg-blue-100 text-blue-800', prescription: 'bg-green-100 text-green-800',
  report: 'bg-purple-100 text-purple-800', vaccine: 'bg-yellow-100 text-yellow-800',
  certificate: 'bg-orange-100 text-orange-800',
};
const apptTypeLabels: Record<string, string> = { consultation: 'Consulta', exam: 'Exame', return: 'Retorno' };

export default function Documents() {
  const { user } = useAuth();
  const { selectedPatient } = useFamily();
  const targetUserId = selectedPatient?.id || user?.id;
  const { toast } = useToast();
  const [docs, setDocs] = useState<DocWithAppt[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchDocs = useCallback(async () => {
    if (!targetUserId) return;
    const { data } = await supabase
      .from('medical_documents')
      .select('*, appointments(appointment_date, type, doctors(name, specialty))')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });
    setDocs((data as any) || []);
    setLoading(false);
  }, [targetUserId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !targetUserId) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024;

    setUploading(true);
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

        await supabase.from('medical_documents').insert({
          user_id: targetUserId,
          type: 'exam',
          title: file.name.replace(/\.[^.]+$/, ''),
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          document_date: new Date().toISOString().split('T')[0],
        });
      }
      toast({ title: 'Documentos enviados!' });
      fetchDocs();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro no upload', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async (doc: MedicalDocument) => {
    await supabase.from('medical_documents').delete().eq('id', doc.id);
    fetchDocs();
    toast({ title: 'Documento excluído' });
  };

  const filtered = docs.filter((d) => {
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documentos Médicos</h1>
        <p className="text-muted-foreground">Armazene e organize seus documentos</p>
      </div>

      {/* Upload Zone */}
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Upload className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-3">Arraste arquivos ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground mb-4">PDF, JPG, PNG - Máximo 10MB por arquivo</p>
          <Button variant="outline" disabled={uploading} onClick={() => document.getElementById('file-upload')?.click()}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Selecionar Arquivos
          </Button>
          <input id="file-upload" type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleUpload(e.target.files)} />
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar documentos..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhum documento encontrado</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {doc.file_type.includes('image') ? <Image className="h-5 w-5" /> : <File className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(doc.file_size)}</p>
                    </div>
                  </div>
                  <Badge className={typeColors[doc.type]}>{typeLabels[doc.type]}</Badge>
                </div>

                {/* Appointment info */}
                {doc.appointments && (
                  <div className="mb-3 rounded-md bg-muted/50 p-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                      <Stethoscope className="h-3 w-3" />
                      <span>{doc.appointments.doctors?.name || 'Médico'}</span>
                      {doc.appointments.doctors?.specialty && (
                        <span className="text-muted-foreground">• {doc.appointments.doctors.specialty}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      <span>{apptTypeLabels[doc.appointments.type] || doc.appointments.type} - {new Date(doc.appointments.appointment_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                )}

                {doc.document_date && !doc.appointments && (
                  <p className="text-xs text-muted-foreground mb-3">{new Date(doc.document_date).toLocaleDateString('pt-BR')}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild className="flex-1">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download className="mr-1 h-3 w-3" /> Baixar</a>
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteDoc(doc)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
