import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, ArrowLeft } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
    const { subscription, isPro, loading } = useSubscription();
    const { user } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
    const navigate = useNavigate();

    const handleSubscribe = (plan: 'free' | 'pro') => {
        if (!user) {
            navigate('/register');
            return;
        }
        if (plan === 'free') return;
        // TODO: Integrate with payment gateway
        console.log('Subscribe to:', plan, selectedPlan);
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-b z-50">
                <div className="max-w-6xl mx-auto flex justify-between items-center px-4">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-primary-foreground font-bold text-lg">M</span>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                            MedCare
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar ao App
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                                    Entrar
                                </Button>
                                <Button size="sm" onClick={() => navigate('/register')}>
                                    Criar Conta
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="container max-w-6xl mx-auto py-16 px-4">
                <div className="text-center mb-12">
                    <Badge variant="secondary" className="mb-4">Planos Flexíveis</Badge>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                        Escolha o plano ideal para sua família
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Comece gratuitamente e faça upgrade quando precisar de mais recursos para cuidar de quem você ama.
                    </p>

                    {/* Toggle Monthly/Yearly */}
                    <div className="inline-flex items-center gap-2 bg-muted p-1.5 rounded-xl shadow-sm border border-border">
                        <Button
                            variant={selectedPlan === 'monthly' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSelectedPlan('monthly')}
                            className="rounded-lg"
                        >
                            Mensal
                        </Button>
                        <Button
                            variant={selectedPlan === 'yearly' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSelectedPlan('yearly')}
                            className="rounded-lg relative"
                        >
                            Anual
                            <span className="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-bounce">
                                -16%
                            </span>
                        </Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <Card className={`relative overflow-hidden transition-all duration-300 ${isPro ? 'opacity-75 border-border' : 'border-primary/20 shadow-lg scale-[1.02]'}`}>
                        <CardHeader>
                            <CardTitle className="text-2xl">Gratuito</CardTitle>
                            <CardDescription>Para começar a cuidar</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold text-foreground">R$ 0</span>
                                <span className="text-muted-foreground">/mês</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-muted-foreground">1 perfil pessoal + 1 dependente</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-muted-foreground">5 medicamentos por perfil</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-muted-foreground">Consultas ilimitadas</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-muted-foreground">10 documentos (retenção 6 meses)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-muted-foreground">Botão de pânico + 1 contato</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-muted-foreground">Histórico de 90 dias</span>
                                </li>
                            </ul>
                            <Button
                                variant="outline"
                                className="w-full"
                                disabled={!isPro && !!user}
                                onClick={() => handleSubscribe('free')}
                            >
                                {!user ? 'Começar Grátis' : (!isPro ? 'Plano Atual' : 'Fazer Downgrade')}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Pro Plan */}
                    <Card className={`relative overflow-hidden transition-all duration-300 ${isPro ? 'border-primary ring-2 ring-primary/20 shadow-xl scale-[1.02]' : 'border-primary/30 hover:border-primary/50 shadow-md hover:shadow-xl'}`}>
                        {/* Popular Badge */}
                        <div className="absolute top-0 right-0 bg-gradient-to-bl from-primary to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                            RECOMENDADO
                        </div>

                        <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                                <CardTitle className="text-2xl flex items-center gap-2 text-primary">
                                    Pro
                                    <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                </CardTitle>
                                {isPro && <Badge variant="secondary" className="bg-primary/10 text-primary">Ativo</Badge>}
                            </div>
                            <CardDescription>Liberdade total para cuidar da família</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold text-foreground">
                                    R$ {selectedPlan === 'monthly' ? '9,90' : '99,00'}
                                </span>
                                <span className="text-muted-foreground">
                                    /{selectedPlan === 'monthly' ? 'mês' : 'ano'}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2">
                                    <div className="bg-primary/10 p-0.5 rounded-full mt-0.5">
                                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">Até 5 perfis de dependentes</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="bg-primary/10 p-0.5 rounded-full mt-0.5">
                                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">Medicamentos ilimitados</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="bg-primary/10 p-0.5 rounded-full mt-0.5">
                                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">Documentos e exames ilimitados (2 anos)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="bg-primary/10 p-0.5 rounded-full mt-0.5">
                                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">Compartilhamento seguro com cuidadores</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="bg-primary/10 p-0.5 rounded-full mt-0.5">
                                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">Até 5 contatos de emergência</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="bg-primary/10 p-0.5 rounded-full mt-0.5">
                                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">Histórico de saúde ilimitado</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="bg-primary/10 p-0.5 rounded-full mt-0.5">
                                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">Exportação de relatórios em PDF</span>
                                </li>
                            </ul>

                            <div className="space-y-3">
                                <Button
                                    className={`w-full font-bold shadow-md hover:shadow-lg transition-all ${isPro ? 'bg-muted text-muted-foreground hover:bg-muted/80' : 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white'}`}
                                    disabled={isPro}
                                    onClick={() => handleSubscribe('pro')}
                                >
                                    {isPro ? 'Seu Plano Atual' : (!user ? 'Criar Conta e Assinar' : 'Experimentar 14 dias Grátis')}
                                </Button>
                                {!isPro && (
                                    <p className="text-xs text-center text-muted-foreground">
                                        Teste grátis de 14 dias. Não cobramos hoje.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* FAQ or Trust Section could go here */}
                <div className="mt-20 text-center">
                    <p className="text-muted-foreground mb-4">Dúvidas sobre os planos?</p>
                    <Button variant="link" onClick={() => navigate('/help')}>Fale com nosso suporte</Button>
                </div>
            </div>
        </div>
    );
}
