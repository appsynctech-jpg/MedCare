import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Settings2, ShieldCheck, Bot, Sparkles, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function SystemSettings() {
    const [autoProEnabled, setAutoProEnabled] = useState(false);

    // AI Settings State
    const [aiConfig, setAiConfig] = useState({ prompt: '', model: 'gemini-1.5-flash' });
    const [originalPrompt, setOriginalPrompt] = useState(''); // Para detectar mudanças

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'auto_pro_enabled')
                .single();

            if (data) {
                setAutoProEnabled(data.value.enabled || false);
            }

            // Fetch AI Config
            const { data: aiData } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'ai_assistant_config')
                .single();

            if (aiData && aiData.value) {
                const config = typeof aiData.value === 'string' ? JSON.parse(aiData.value) : aiData.value;
                setAiConfig({
                    prompt: config.prompt || '',
                    model: config.model || 'gemini-1.5-flash'
                });
                setOriginalPrompt(config.prompt || '');
            }

            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleToggleAutoPro = async (checked: boolean) => {
        setAutoProEnabled(checked);
        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    key: 'auto_pro_enabled',
                    value: { enabled: checked },
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            toast({
                title: checked ? 'Modo PRO Automático Ativado' : 'Modo PRO Automático Desativado',
                description: checked
                    ? 'Novos usuários serão PRO automaticamente.'
                    : 'Novos usuários serão Free por padrão.'
            });
        } catch (error) {
            setAutoProEnabled(!checked);
            toast({
                title: 'Erro ao atualizar configuração',
                description: 'Não foi possível salvar a alteração.',
                variant: 'destructive'
            });
        }
    };

    const handleSaveAiConfig = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    key: 'ai_assistant_config',
                    value: aiConfig,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setOriginalPrompt(aiConfig.prompt);
            toast({
                title: 'Cérebro da IA Atualizado! 🧠',
                description: 'O novo manual de instruções já está valendo para todos os usuários.',
            });
        } catch (error) {
            toast({
                title: 'Erro ao salvar',
                description: 'Não foi possível atualizar o prompt da IA.',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

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
                <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
                <p className="text-muted-foreground">Gerencie o comportamento global da plataforma MedCare.</p>
            </div>

            <div className="grid gap-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Acesso e Assinaturas</CardTitle>
                                <CardDescription>Regras de entrada para novos usuários</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
                            <div className="space-y-0.5 max-w-[80%]">
                                <Label className="text-base">Modo PRO Automático</Label>
                                <p className="text-sm text-muted-foreground">
                                    Enquanto ativo, todos os novos usuários registrados receberão o plano PRO gratuitamente por 1 ano.
                                </p>
                            </div>
                            <Switch
                                checked={autoProEnabled}
                                onCheckedChange={handleToggleAutoPro}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-blue-500/20 shadow-lg shadow-blue-500/5 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Bot className="h-32 w-32" />
                    </div>
                    <CardHeader className="bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Sparkles className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <CardTitle>Cérebro da IA</CardTitle>
                                <CardDescription>Treine o assistente ensinando novas regras</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label className="text-base">Manual de Instruções (Prompt do Sistema)</Label>
                            <p className="text-sm text-muted-foreground">
                                Tudo o que você escrever aqui será usado como "verdade absoluta" pela IA.
                                Use para adicionar novas funcionalidades, mudar o tom de voz ou corrigir respostas erradas.
                            </p>
                            <Textarea
                                value={aiConfig.prompt}
                                onChange={(e) => setAiConfig(prev => ({ ...prev, prompt: e.target.value }))}
                                className="min-h-[300px] font-mono text-sm leading-relaxed bg-muted/30 focus:bg-background transition-colors resize-y"
                                placeholder="Ex: Você é um assistente médico..."
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <ShieldCheck className="h-3 w-3" />
                                <span>Modelo atual: <strong>{aiConfig.model}</strong></span>
                            </div>
                            <Button
                                onClick={handleSaveAiConfig}
                                disabled={saving || aiConfig.prompt === originalPrompt}
                                className="gap-2"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Salvar Treinamento
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-dashed">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                                <Settings2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-muted-foreground">Configurações Avançadas</CardTitle>
                                <CardDescription>Funcionalidades em desenvolvimento</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-center text-muted-foreground py-8 italic">
                            Novas chaves de configuração (Manutenção, Limites Globais) aparecerão aqui futuramente.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
