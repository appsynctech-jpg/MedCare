import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useFamily } from '@/hooks/useFamily';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Sun, Moon, Monitor, User, Share2, XCircle, RefreshCw, UserPlus } from 'lucide-react';
import { ShareModal } from '@/components/sharing/ShareModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Profile, EmergencyContact, SharedAccess, CaregiverRelationship } from '@/types';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallModal } from '@/components/subscription/PaywallModal';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    relationships,
    loading: loadingFamily,
    refreshFamily,
    addDependent
  } = useFamily();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [shares, setShares] = useState<SharedAccess[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingShares, setLoadingShares] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');

  // Theme
  const [theme, setTheme] = useState<string>('light');
  const [fontSize, setFontSize] = useState<string>('md');

  // New contact form
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Family invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [dependentName, setDependentName] = useState('');
  const [dependentBirthDate, setDependentBirthDate] = useState('');
  const [dependentRelationship, setDependentRelationship] = useState('');
  const [addingDependent, setAddingDependent] = useState(false);
  const { canAddDependent, canAddEmergencyContact, limits } = useSubscription();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<'dependent' | 'emergency_contact'>('dependent');

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) {
        const p = data as any;
        setProfile(p);
        setFullName(p.full_name || '');
        setPhone(p.phone || '');
        setBirthDate(p.birth_date || '');
        setTheme(p.theme || 'light');
        setFontSize(p.font_size || 'md');
        setBloodType(p.emergency_info?.blood_type || '');
        setAllergies(p.emergency_info?.allergies?.join(', ') || '');
        setConditions(p.emergency_info?.chronic_conditions?.join(', ') || '');
      }
      setLoadingProfile(false);
    };

    const fetchContacts = async () => {
      const { data } = await supabase.from('emergency_contacts').select('*').eq('user_id', user.id).order('priority');
      setContacts((data as any) || []);
      setLoadingContacts(false);
    };

    const fetchShares = async () => {
      const { data } = await supabase
        .from('shared_access')
        .select('*, profiles!shared_access_profile_id_fkey(full_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setShares((data as any) || []);
      setLoadingShares(false);
    };

    fetchProfile();
    fetchContacts();
    fetchShares();
  }, [user]);

  const applyTheme = (t: string) => {
    document.documentElement.classList.remove('dark', 'high-contrast');
    if (t === 'dark') document.documentElement.classList.add('dark');
    if (t === 'high-contrast') document.documentElement.classList.add('high-contrast');
    document.documentElement.setAttribute('data-font-size', fontSize);

    // Sync with localStorage for flash prevention on reload
    localStorage.setItem('medcare-theme', t);
    localStorage.setItem('medcare-font-size', fontSize);
  };

  useEffect(() => { applyTheme(theme); }, [theme, fontSize]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({
        full_name: fullName,
        phone: phone || null,
        birth_date: birthDate || null,
        theme, font_size: fontSize,
        emergency_info: {
          blood_type: bloodType || null,
          allergies: allergies ? allergies.split(',').map((s) => s.trim()) : [],
          chronic_conditions: conditions ? conditions.split(',').map((s) => s.trim()) : [],
        },
      }).eq('id', user.id);
      toast({ title: 'Perfil atualizado!' });
    } catch { toast({ variant: 'destructive', title: 'Erro ao salvar' }); }
    finally { setSaving(false); }
  };

  const addContact = async () => {
    if (!user || !newContactName || !newContactPhone) return;

    // Check subscription limits
    const canAdd = await canAddEmergencyContact();
    if (!canAdd) {
      setPaywallFeature('emergency_contact');
      setPaywallOpen(true);
      return;
    }

    await supabase.from('emergency_contacts').insert({
      user_id: user.id, name: newContactName, relationship: newContactRelation || 'Outro',
      phone: newContactPhone, email: newContactEmail || null, priority: contacts.length + 1,
    });
    setNewContactName(''); setNewContactRelation(''); setNewContactPhone(''); setNewContactEmail('');
    const { data } = await supabase.from('emergency_contacts').select('*').eq('user_id', user.id).order('priority');
    setContacts((data as any) || []);
    toast({ title: 'Contato adicionado!' });
  };

  const deleteContact = async (id: string) => {
    await supabase.from('emergency_contacts').delete().eq('id', id);
    setContacts(contacts.filter((c) => c.id !== id));
    toast({ title: 'Contato removido' });
  };

  const revokeShare = async (id: string) => {
    await supabase.from('shared_access').update({ revoked: true }).eq('id', id);
    setShares(shares.map((s) => s.id === id ? { ...s, revoked: true } : s));
    toast({ title: 'Compartilhamento revogado' });
  };

  const deleteShare = async (id: string) => {
    const { error } = await supabase.from('shared_access').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
      return;
    }
    setShares(shares.filter((s) => s.id !== id));
    toast({ title: 'Compartilhamento excluído permanentemente' });
  };

  const handleAddDependent = async () => {
    if (!dependentName.trim()) return;

    // Check subscription limits
    const canAdd = await canAddDependent();
    if (!canAdd) {
      setPaywallFeature('dependent');
      setPaywallOpen(true);
      return;
    }

    try {
      setAddingDependent(true);
      await addDependent(dependentName, dependentBirthDate || undefined, dependentRelationship || undefined);
      toast({
        title: "Perfil criado!",
        description: `O perfil de ${dependentName} foi adicionado com sucesso.`,
      });
      setDependentName('');
      setDependentBirthDate('');
      setDependentRelationship('');
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao criar perfil",
        description: "Não foi possível criar o perfil do dependente.",
      });
    } finally {
      setAddingDependent(false);
    }
  };

  const inviteCaregiver = async () => {
    if (!user || !inviteEmail) return;
    setInviting(true);
    try {
      // Find user by email
      const { data: targetUser, error: findError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail.trim().toLowerCase())
        .maybeSingle();

      if (findError) throw findError;

      if (!targetUser) {
        toast({ variant: 'destructive', title: 'Usuário não encontrado', description: 'O familiar deve ter uma conta no MedCare.' });
        return;
      }

      const { error: inviteError } = await supabase
        .from('caregiver_relationships')
        .insert({
          patient_id: user.id,
          caregiver_id: targetUser.id,
          status: 'pending'
        });

      if (inviteError) throw inviteError;

      toast({ title: 'Convite enviado!', description: 'Seu familiar deve aceitar o vínculo no painel dele.' });
      setInviteEmail('');
      // Refresh list
      await refreshFamily();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao enviar convite', description: e.message });
    } finally {
      setInviting(false);
    }
  };

  const updateRelationship = async (id: string, status: 'accepted' | 'rejected') => {
    await supabase.from('caregiver_relationships').update({ status }).eq('id', id);
    await refreshFamily();
    toast({ title: status === 'accepted' ? 'Vínculo aceito!' : 'Vínculo rejeitado' });
  };

  const deleteRelationship = async (id: string) => {
    const { error } = await supabase.from('caregiver_relationships').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao remover', description: error.message });
      return;
    }
    await refreshFamily();
    toast({ title: 'Vínculo/Convite removido' });
  };

  const resendInvitation = async (relationship: CaregiverRelationship) => {
    setInviting(true);
    try {
      // In a real scenario, this might trigger a new email notification.
      // For now, we update the timestamp to reflect activity.
      const { error } = await supabase
        .from('caregiver_relationships')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', relationship.id);

      if (error) throw error;
      toast({ title: 'Convite reenviado!', description: 'Aguarde o aceite do seu familiar.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao reenviar', description: e.message });
    } finally {
      setInviting(false);
    }
  };


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="emergency">Emergência</TabsTrigger>
          <TabsTrigger value="family">Família</TabsTrigger>
          <TabsTrigger value="sharing">Compartilhamento</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Dados Pessoais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {loadingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Nascimento</Label>
                      <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo Sanguíneo</Label>
                      <Input value={bloodType} onChange={(e) => setBloodType(e.target.value)} placeholder="Ex: A+" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Alergias (separar por vírgula)</Label>
                    <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Ex: Penicilina, Dipirona" />
                  </div>
                  <div className="space-y-2">
                    <Label>Condições Crônicas (separar por vírgula)</Label>
                    <Input value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Ex: Diabetes, Hipertensão" />
                  </div>
                  <Button onClick={saveProfile} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Perfil
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Tema</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'light', label: 'Claro', icon: Sun },
                  { value: 'dark', label: 'Escuro', icon: Moon },
                  { value: 'high-contrast', label: 'Alto Contraste', icon: Monitor },
                ].map((t) => (
                  <Button key={t.value} variant={theme === t.value ? 'default' : 'outline'}
                    className="flex-col h-auto py-4 gap-2" onClick={() => setTheme(t.value)}>
                    <t.icon className="h-5 w-5" />
                    <span className="text-xs">{t.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">Tamanho da Fonte</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: 'sm', label: 'Pequeno' },
                  { value: 'md', label: 'Médio' },
                  { value: 'lg', label: 'Grande' },
                  { value: 'xl', label: 'Extra Grande' },
                ].map((f) => (
                  <Button key={f.value} variant={fontSize === f.value ? 'default' : 'outline'}
                    size="sm" onClick={() => setFontSize(f.value)}>
                    {f.label}
                  </Button>
                ))}
              </div>
              <p className="mt-4 text-muted-foreground" style={{ fontSize: 'var(--font-size-base)' }}>
                Preview: Este é o tamanho do texto selecionado.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="family" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserPlus className="h-5 w-5" /> Adicionar Dependente (Filhos/Pais)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do dependente</Label>
                  <Input
                    placeholder="Ex: João Silva"
                    value={dependentName}
                    onChange={(e) => setDependentName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Nascimento (opcional)</Label>
                    <Input
                      type="date"
                      value={dependentBirthDate}
                      onChange={(e) => setDependentBirthDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relação (opcional)</Label>
                    <Input
                      placeholder="Ex: Filho, Mãe, Avô"
                      value={dependentRelationship}
                      onChange={(e) => setDependentRelationship(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleAddDependent} disabled={addingDependent || !dependentName.trim()} className="w-full">
                  {addingDependent ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Perfil'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Perfis de dependentes são gerenciados por você. Alertas e dados ficarão disponíveis na sua conta.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5" /> Convidar Familiar (Conta Existente)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label>E-mail do familiar</Label>
                  <Input
                    placeholder="exemplo@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    type="email"
                  />
                </div>
                <Button className="self-end" onClick={inviteCaregiver} disabled={inviting || !inviteEmail}>
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Convidar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                O familiar precisa ter uma conta no MedCare para que o vínculo seja realizado.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Vínculos de Cuidado</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {loadingFamily ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <>
                  {relationships.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum vínculo familiar cadastrado.</p>
                  ) : relationships.map((r) => {
                    const isPatient = r.patient_id === user?.id;
                    const roleLabel = isPatient ? 'Seu Cuidador' : 'Paciente sob seu cuidado';
                    const targetName = isPatient ? 'Alguém' : (r as any).profiles?.full_name || 'Paciente';

                    return (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-1">
                          <p className="font-semibold">{targetName}</p>
                          <p className="text-xs text-muted-foreground">{roleLabel}</p>
                          <Badge variant={r.status === 'accepted' ? 'default' : r.status === 'pending' ? 'secondary' : 'destructive'}>
                            {r.status === 'accepted' ? 'Ativo' : r.status === 'pending' ? 'Pendente' : 'Recusado'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isPatient && r.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => updateRelationship(r.id, 'accepted')}>Aceitar</Button>
                              <Button size="sm" variant="outline" onClick={() => updateRelationship(r.id, 'rejected')}>Recusar</Button>
                            </>
                          )}
                          {isPatient && (
                            <div className="flex items-center gap-1">
                              {r.status === 'pending' && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => resendInvitation(r)} title="Reenviar Convite">
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => deleteRelationship(r.id)} title="Excluir">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {!isPatient && r.status === 'rejected' && (
                            <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => deleteRelationship(r.id)} title="Excluir">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {!isPatient && r.status === 'accepted' && (
                            <ShareModal
                              trigger={
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" title="Compartilhar Perfil">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              }
                              profileId={r.patient_id}
                              profileName={targetName}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Contatos de Emergência</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {loadingContacts ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <>
                  {contacts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {c.relationship} • {c.phone}
                          {c.email && ` • ${c.email}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Prioridade {c.priority}</Badge>
                        <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => deleteContact(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-lg border-dashed border-2 p-4 space-y-3">
                    <p className="text-sm font-medium">Adicionar Contato</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input placeholder="Nome" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} />
                      <Input placeholder="Parentesco" value={newContactRelation} onChange={(e) => setNewContactRelation(e.target.value)} />
                      <Input placeholder="Telefone" value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} />
                      <Input placeholder="E-mail" type="email" value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} />
                    </div>
                    <Button size="sm" onClick={addContact} disabled={!newContactName || !newContactPhone}>
                      <Plus className="mr-2 h-4 w-4" /> Adicionar
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sharing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><Share2 className="h-5 w-5" /> Compartilhamentos</CardTitle>
                {limits.canShare ? (
                  <ShareModal />
                ) : (
                  <Button variant="outline" size="sm" onClick={() => {
                    setPaywallFeature('share' as any);
                    setPaywallOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" /> Compartilhar (Pro)
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingShares ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <>
                  {shares.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum compartilhamento criado ainda.</p>
                  ) : shares.map((s) => {
                    const expired = new Date(s.expires_at) < new Date();
                    const status = s.revoked ? 'Revogado' : expired ? 'Expirado' : 'Ativo';
                    const variant = s.revoked ? 'destructive' : expired ? 'secondary' : 'default';
                    return (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {s.shared_with_email}
                            {(s as any).profiles?.full_name && <span className="text-muted-foreground ml-2">({(s as any).profiles.full_name})</span>}
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {(s.permissions as any)?.medications && <Badge variant="outline" className="text-xs">Medicamentos</Badge>}
                            {(s.permissions as any)?.appointments && <Badge variant="outline" className="text-xs">Consultas</Badge>}
                            {(s.permissions as any)?.documents && <Badge variant="outline" className="text-xs">Documentos</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {s.access_level === 'read' ? '🔍 Leitura' : '✏️ Edição'} • {new Date(s.expires_at).getFullYear() > 9000 ? '♾️ Nunca expira' : `Expira: ${format(new Date(s.expires_at), "dd/MM/yyyy", { locale: ptBR })}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={variant as any}>{status}</Badge>
                          {!s.revoked && !expired && (
                            <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => revokeShare(s.id)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {(s.revoked || expired) && (
                            <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => deleteShare(s.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PaywallModal
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        feature={paywallFeature}
        currentCount={paywallFeature === 'dependent' ? relationships.length : contacts.length}
        limit={paywallFeature === 'dependent' ? limits.dependents : limits.emergencyContacts}
      />
    </div>
  );
}
