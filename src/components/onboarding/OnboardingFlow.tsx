import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sun, Moon, Monitor, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

interface OnboardingFlowProps {
    userId: string;
    onComplete: () => void;
}

export function OnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Step 2: Preferences
    const [theme, setTheme] = useState('light');
    const [fontSize, setFontSize] = useState('md');

    // Step 3: Emergency Contact
    const [contactName, setContactName] = useState('');
    const [contactRelation, setContactRelation] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    const nextStep = () => setStep((s) => s + 1);
    const prevStep = () => setStep((s) => s - 1);

    // Immediate preview of theme and font size
    const updatePreview = (t: string, f: string) => {
        // Apply theme classes
        document.documentElement.classList.remove('dark', 'high-contrast');
        if (t === 'dark') document.documentElement.classList.add('dark');
        if (t === 'high-contrast') document.documentElement.classList.add('high-contrast');

        // Remove existing font size classes
        document.documentElement.classList.remove('text-sm', 'text-md', 'text-lg', 'text-xl');
        // Add current selection
        document.documentElement.classList.add(`text-${f}`);
    };

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        updatePreview(newTheme, fontSize);
    };

    const handleFontSizeChange = (newSize: string) => {
        setFontSize(newSize);
        updatePreview(theme, newSize);
    };

    const handleStep2 = () => {
        nextStep();
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            // Create emergency contact if provided
            if (contactName && contactPhone) {
                await supabase.from('emergency_contacts').insert({
                    user_id: userId,
                    name: contactName,
                    relationship: contactRelation || 'Outro',
                    phone: contactPhone,
                    priority: 1
                });
            }

            // Update profile
            const { error } = await supabase.from('profiles').update({
                theme,
                font_size: fontSize,
                onboarding_completed: true
            }).eq('id', userId);

            if (error) throw error;

            toast({ title: 'Onboarding concluído!', description: 'Bem-vindo ao MedCare.' });
            onComplete();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md shadow-2xl border-primary/20">
                <div className="h-1.5 w-full bg-muted overflow-hidden rounded-t-lg">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-in-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                {step === 1 && (
                    <div className="p-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="mx-auto flex items-center justify-center mb-6">
                            <img src="/MedCare.png" alt="MedCare Logo" className="h-28 w-auto" />
                        </div>
                        <CardHeader className="p-0">
                            <CardTitle className="text-2xl font-bold pt-2">Bem-vindo ao MedCare</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
                            <p className="text-muted-foreground">
                                Sua saúde em suas mãos. Vamos configurar algumas coisas básicas para você começar sua jornada.
                            </p>
                            <div className="grid grid-cols-1 gap-3 text-sm text-left pt-4">
                                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" /> Organize seus medicamentos</div>
                                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-500" /> Agende suas consultas</div>
                                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-green-500" /> Guarde seus documentos</div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-0 pt-8">
                            <Button className="w-full group" onClick={nextStep}>
                                Começar <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </CardFooter>
                    </div>
                )}

                {step === 2 && (
                    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-300">
                        <CardHeader className="p-0">
                            <CardTitle className="text-xl">Como você prefere ver o MedCare?</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-6">
                            <div className="space-y-3">
                                <Label>Tema Visual</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'light', label: 'Claro', icon: Sun },
                                        { id: 'dark', label: 'Escuro', icon: Moon },
                                        { id: 'high-contrast', label: 'Contraste', icon: Monitor },
                                    ].map((t) => (
                                        <Button
                                            key={t.id}
                                            variant={theme === t.id ? 'default' : 'outline'}
                                            className="flex-col h-auto py-3 gap-1 px-1"
                                            onClick={() => handleThemeChange(t.id)}
                                        >
                                            <t.icon className="h-5 w-5" />
                                            <span className="text-[10px] sm:text-xs">{t.label}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Tamanho do Texto</Label>
                                <div className="flex gap-2">
                                    {['sm', 'md', 'lg', 'xl'].map((f) => (
                                        <Button
                                            key={f}
                                            variant={fontSize === f ? 'default' : 'outline'}
                                            className="flex-1 uppercase text-xs font-bold h-10"
                                            onClick={() => handleFontSizeChange(f)}
                                        >
                                            {f}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-0 pt-4 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={prevStep}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                            <Button className="flex-1" onClick={handleStep2}>Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </CardFooter>
                    </div>
                )}

                {step === 3 && (
                    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-300">
                        <CardHeader className="p-0">
                            <CardTitle className="text-xl">Segurança em Primeiro Lugar</CardTitle>
                            <p className="text-sm text-muted-foreground mt-2">
                                Adicione um contato para emergências. Você poderá adicionar mais depois nas configurações.
                            </p>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Contato</Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: Maria Santos"
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="relation">Parentesco</Label>
                                <Input
                                    id="relation"
                                    placeholder="Ex: Esposa, Irmão"
                                    value={contactRelation}
                                    onChange={(e) => setContactRelation(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    placeholder="(00) 00000-0000"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="p-0 pt-4 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={prevStep} disabled={loading}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                            <Button className="flex-1" onClick={handleFinish} disabled={loading}>
                                {loading ? 'Salvando...' : 'Concluir'} <Check className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                        <div className="text-center">
                            <Button variant="link" className="text-xs text-muted-foreground" onClick={handleFinish} disabled={loading}>
                                Pular esta etapa por enquanto
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
