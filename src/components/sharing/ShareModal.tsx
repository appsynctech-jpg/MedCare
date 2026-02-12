import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Copy, Loader2, Check } from 'lucide-react';

interface ShareModalProps {
  trigger?: React.ReactNode;
}

export function ShareModal({ trigger }: ShareModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const [email, setEmail] = useState('');
  const [medications, setMedications] = useState(true);
  const [appointments, setAppointments] = useState(true);
  const [documents, setDocuments] = useState(false);
  const [accessLevel, setAccessLevel] = useState<'read' | 'write'>('read');
  const [duration, setDuration] = useState('7');

  const reset = () => {
    setEmail('');
    setMedications(true);
    setAppointments(true);
    setDocuments(false);
    setAccessLevel('read');
    setDuration('7');
    setGeneratedLink('');
    setCopied(false);
  };

  const handleGenerate = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Informe o email do destinatário' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-share-link', {
        body: {
          shared_with_email: email,
          permissions: { medications, appointments, documents },
          access_level: accessLevel,
          duration_days: parseInt(duration),
        },
      });
      if (error) throw error;
      setGeneratedLink(data.link);
      toast({ title: 'Link gerado com sucesso!' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao gerar link', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast({ title: 'Link copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" /> Compartilhar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Dados Médicos</DialogTitle>
          <DialogDescription>
            Gere um link temporário para permitir que médicos ou familiares acessem seus registros de saúde.
          </DialogDescription>
        </DialogHeader>

        {generatedLink ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Link gerado! Envie-o para <strong>{email}</strong>.</p>
            <div className="flex gap-2">
              <Input value={generatedLink} readOnly className="text-xs" />
              <Button size="icon" variant="outline" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button className="w-full" variant="outline" onClick={() => { reset(); }}>
              Criar outro link
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email do destinatário</Label>
              <Input type="email" placeholder="medico@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>O que compartilhar</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="share-meds" checked={medications} onCheckedChange={(v) => setMedications(!!v)} />
                  <label htmlFor="share-meds" className="text-sm">Medicamentos</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="share-appts" checked={appointments} onCheckedChange={(v) => setAppointments(!!v)} />
                  <label htmlFor="share-appts" className="text-sm">Consultas</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="share-docs" checked={documents} onCheckedChange={(v) => setDocuments(!!v)} />
                  <label htmlFor="share-docs" className="text-sm">Documentos Médicos</label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nível de Acesso</Label>
              <RadioGroup value={accessLevel} onValueChange={(v) => setAccessLevel(v as 'read' | 'write')}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="read" id="read" />
                  <label htmlFor="read" className="text-sm">🔍 Somente Leitura</label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="write" id="write" />
                  <label htmlFor="write" className="text-sm">✏️ Leitura e Edição</label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Duração do Acesso</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">24 horas</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="365">1 ano</SelectItem>
                  <SelectItem value="999999">Nunca expira</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleGenerate} disabled={loading || !email}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gerar Link de Compartilhamento
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
