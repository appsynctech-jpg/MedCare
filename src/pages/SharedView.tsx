import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Pill, Calendar, FileText, AlertTriangle, Clock, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AdherenceCalendar } from '@/components/medications/AdherenceCalendar';

export default function SharedView() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke('get-shared-data', {
          body: null,
          method: 'GET',
          headers: {},
        });

        // Use query params approach since GET with body isn't ideal
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-data?token=${token}`,
          { headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Erro ao carregar dados');
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Acesso Indisponível</h2>
          <p className="text-muted-foreground text-center">{error}</p>
        </CardContent>
      </Card>
    </div>
  );

  const tabs = [];
  if (data.medications) tabs.push('medications');
  if (data.appointments) tabs.push('appointments');
  if (data.documents) tabs.push('documents');

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-primary/5 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm">Dados de <strong>{data.owner_name}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(data.expires_at).getFullYear() > 9000 ? 'Acesso Permanente' : `Expira em ${format(new Date(data.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <Tabs defaultValue={tabs[0]} className="space-y-4">
          <TabsList>
            {tabs.includes('medications') && (
              <TabsTrigger value="medications"><Pill className="mr-1 h-4 w-4" /> Medicamentos</TabsTrigger>
            )}
            {tabs.includes('appointments') && (
              <TabsTrigger value="appointments"><Calendar className="mr-1 h-4 w-4" /> Consultas</TabsTrigger>
            )}
            {tabs.includes('documents') && (
              <TabsTrigger value="documents"><FileText className="mr-1 h-4 w-4" /> Documentos</TabsTrigger>
            )}
          </TabsList>

          {tabs.includes('medications') && (
            <TabsContent value="medications" className="space-y-3">
              {data.medications.map((m: any) => (
                <Card key={m.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Pill className="h-4 w-4 text-primary" />
                      {m.name} — {m.dosage}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    {m.form && <p>Forma: {m.form}</p>}
                    <p>Frequência: {m.daily_frequency}x ao dia</p>
                    {m.instructions && <p>Instruções: {m.instructions}</p>}
                    {m.medication_schedules?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {m.medication_schedules.map((s: any) => (
                          <Badge key={s.id} variant="secondary">{s.time?.slice(0, 5)}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {data.medication_logs && (
                <div className="mt-6">
                  <AdherenceCalendar externalLogs={data.medication_logs} />
                </div>
              )}
              {data.medications.length === 0 && <p className="text-muted-foreground text-sm">Nenhum medicamento ativo.</p>}
            </TabsContent>
          )}

          {tabs.includes('appointments') && (
            <TabsContent value="appointments" className="space-y-3">
              {data.appointments.map((a: any) => (
                <Card key={a.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {format(new Date(a.appointment_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <div className="flex flex-col gap-1">
                      {a.doctors && <p>Médico: {a.doctors.name} ({a.doctors.specialty})</p>}
                      <p>Tipo: <Badge variant="outline">{a.type === 'consultation' ? 'Consulta' : a.type === 'exam' ? 'Exame' : 'Retorno'}</Badge></p>
                      {a.preparations && <p><strong>Preparos:</strong> {a.preparations}</p>}
                    </div>
                    {a.notes && (
                      <div className="mt-2 rounded-md bg-muted/50 p-3 italic">
                        <p className="font-semibold not-italic mb-1">Anotações:</p>
                        {a.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {data.appointments.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma consulta futura.</p>}
            </TabsContent>
          )}

          {tabs.includes('documents') && (
            <TabsContent value="documents" className="space-y-3">
              {data.documents.map((d: any) => (
                <Card key={d.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {d.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <Badge variant="outline" className="mr-2">{d.type}</Badge>
                    {d.document_date && <span>{format(new Date(d.document_date), 'dd/MM/yyyy')}</span>}
                    {d.description && <p className="mt-1">{d.description}</p>}
                  </CardContent>
                </Card>
              ))}
              {data.documents.length === 0 && <p className="text-muted-foreground text-sm">Nenhum documento.</p>}
            </TabsContent>
          )}
        </Tabs>

        <p className="text-center text-xs text-muted-foreground mt-8">
          🔒 Dados protegidos • Acesso {data.access_level === 'read' ? 'somente leitura' : 'leitura e edição'}
        </p>
      </div>
    </div>
  );
}
