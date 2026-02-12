import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFamily } from '@/hooks/useFamily';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Phone, Mail, MapPin, User, Trash2, Edit2, Search } from 'lucide-react';
import type { Doctor } from '@/types';

export default function Doctors() {
    const { user } = useAuth();
    const { selectedPatient } = useFamily();
    const targetUserId = selectedPatient?.id || user?.id;
    const { toast } = useToast();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
    const [saving, setSaving] = useState(false);

    // Input states
    const [name, setName] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [crm, setCrm] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');

    const fetchDoctors = async () => {
        if (!targetUserId) return;
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('user_id', targetUserId)
            .order('name');

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao carregar médicos' });
        } else {
            setDoctors(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDoctors();
    }, [targetUserId]);

    const resetForm = () => {
        setEditingDoctor(null);
        setName('');
        setSpecialty('');
        setCrm('');
        setPhone('');
        setEmail('');
        setAddress('');
    };

    const handleEdit = (doc: Doctor) => {
        setEditingDoctor(doc);
        setName(doc.name || '');
        setSpecialty(doc.specialty || '');
        setCrm(doc.crm || '');
        setPhone(doc.phone || '');
        setEmail(doc.email || '');
        setAddress(doc.address || '');
        setIsDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name) return;
        setSaving(true);

        const doctorData = {
            user_id: targetUserId,
            name,
            specialty,
            crm,
            phone,
            email,
            address,
        };

        try {
            if (editingDoctor) {
                const { error } = await supabase
                    .from('doctors')
                    .update(doctorData)
                    .eq('id', editingDoctor.id);
                if (error) throw error;
                toast({ title: 'Médico atualizado com sucesso!' });
            } else {
                const { error } = await supabase
                    .from('doctors')
                    .insert([doctorData]);
                if (error) throw error;
                toast({ title: 'Médico cadastrado com sucesso!' });
            }
            setIsDialogOpen(false);
            resetForm();
            fetchDoctors();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao salvar médico', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este médico? Isso não afetará as consultas já marcadas.')) return;

        const { error } = await supabase
            .from('doctors')
            .delete()
            .eq('id', id);

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao excluir médico' });
        } else {
            toast({ title: 'Médico removido' });
            fetchDoctors();
        }
    };

    const filteredDoctors = doctors.filter(doc =>
        doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <h1 className="text-2xl font-bold">Médicos</h1>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Médico
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingDoctor ? 'Editar Médico' : 'Novo Médico'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="name">Nome Completo *</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Dr. João Silva" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="specialty">Especialidade</Label>
                                    <Input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ex: Cardiologia" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="crm">CRM</Label>
                                    <Input id="crm" value={crm} onChange={(e) => setCrm(e.target.value)} placeholder="00000-UF" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="medico@exemplo.com" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="address">Endereço / Consultório</Label>
                                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, Número, Bairro, Cidade" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingDoctor ? 'Salvar Alterações' : 'Cadastrar'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome ou especialidade..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredDoctors.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium">Nenhum médico encontrado</h3>
                        <p className="text-muted-foreground max-w-sm">
                            {searchTerm ? 'Tente buscar com outros termos.' : 'Comece cadastrando seus médicos para facilitar o agendamento de consultas.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDoctors.map((doc) => (
                        <Card key={doc.id} className="group hover:shadow-md transition-shadow dark:bg-card/50">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {doc.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base truncate max-w-[150px]">{doc.name}</CardTitle>
                                            <p className="text-xs text-primary font-medium">{doc.specialty || 'Clínico Geral'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => handleEdit(doc)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(doc.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {doc.crm && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">CRM</Badge>
                                        <span className="text-xs">{doc.crm}</span>
                                    </div>
                                )}
                                {doc.phone && (
                                    <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                        <Phone className="h-3.5 w-3.5" />
                                        <a href={`tel:${doc.phone}`} className="hover:underline">{doc.phone}</a>
                                    </div>
                                )}
                                {doc.email && (
                                    <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                        <Mail className="h-3.5 w-3.5" />
                                        <a href={`mailto:${doc.email}`} className="hover:underline truncate">{doc.email}</a>
                                    </div>
                                )}
                                {doc.address && (
                                    <div className="flex items-start gap-2 text-muted-foreground pt-1 border-t mt-2">
                                        <MapPin className="h-3.5 w-3.5 mt-0.5" />
                                        <span className="text-xs line-clamp-2">{doc.address}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

// Re-using types isn't strictly necessary here if we define it, but let's ensure Badge is available
import { Badge } from '@/components/ui/badge';
