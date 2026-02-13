import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Heart,
    Shield,
    Clock,
    DollarSign,
    Users,
    Bell,
    CheckCircle2,
    Sparkles,
    ArrowRight,
    Star,
    Pill,
    Share2,
    Crown,
    Smartphone,
    Calendar,
    Circle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLandingContent } from '@/hooks/useLandingContent';
import { Loader2 } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();
    const { content, loading } = useLandingContent();

    // Icon mapping for dynamic content
    const iconMap: Record<string, any> = {
        Clock, DollarSign, Heart, Users, Shield, Bell, Share2, Crown, Smartphone, Calendar, CheckCircle2, Sparkles, ArrowRight, Star, Pill
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Get dynamic content with safe defaults
    const hero = content?.hero || {};
    const statsData = content?.stats || {};
    const benefitsData = content?.benefits || {};
    const featuresData = content?.features || {};
    const elderlyData = content?.elderly || {};
    const testimonialsData = content?.testimonials || {};
    const ctaData = content?.cta || {};

    // Helper to get array from indexed object keys (e.g. benefit_1, benefit_2)
    const getList = (data: any, prefix: string) => {
        if (!data) return [];
        return Object.keys(data)
            .filter(key => key.startsWith(prefix))
            .sort()
            .map(key => data[key]);
    };

    const statsList = getList(statsData, 'stat_');
    const benefitsList = getList(benefitsData, 'benefit_');
    const featuresList = getList(featuresData, 'feature_');
    const elderlyHighlights = getList(elderlyData, 'highlight_');
    const testimonialsList = getList(testimonialsData, 'testimonial_');

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src={hero.background_image?.url || "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=1920&h=1080&fit=crop&q=80"}
                        alt={hero.background_image?.alt || "Background"}
                        className="w-full h-full object-cover"
                    />
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-blue-900/70 to-pink-900/80" />
                    <div className="absolute inset-0 bg-black/30" />
                </div>

                {/* Floating pill icon */}
                <div className="absolute top-20 left-10 opacity-20 animate-pulse z-10">
                    <Pill className="h-16 w-16 text-white" />
                </div>
                <div className="absolute bottom-20 right-10 opacity-20 animate-pulse z-10">
                    <Heart className="h-20 w-20 text-white" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-6 text-center space-y-8 py-20">
                    <div className="space-y-6 animate-fade-in">
                        <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {hero.badge?.text || "Plataforma #1 em Gestão de Saúde Familiar"}
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight drop-shadow-2xl whitespace-pre-line">
                            {hero.title?.text || "Cuide de Quem Você Ama,\nMesmo à Distância"}
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
                            {hero.description?.text || "Gerencie medicamentos, consultas e saúde de toda a família em um só lugar."}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            size="lg"
                            className="bg-white text-purple-600 hover:bg-white/90 h-14 px-8 text-lg font-bold shadow-lg shadow-purple-900/20"
                            onClick={() => navigate(hero.cta_primary?.link || '/register')}
                        >
                            {hero.cta_primary?.text || "Começar Grátis"}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-14 px-8 text-lg border-2 bg-transparent text-white border-white hover:bg-white/10 hover:text-white"
                            onClick={() => navigate(hero.cta_secondary?.link || '/pricing')}
                        >
                            {hero.cta_secondary?.text || "Ver Planos"}
                        </Button>
                    </div>

                    <p className="text-sm text-white/80">
                        {hero.footer_text?.text || "✓ Grátis para sempre • ✓ Sem cartão de crédito • ✓ Cancele quando quiser"}
                    </p>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 bg-white border-b">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {statsList.length > 0 ? statsList.map((stat: any, index: number) => (
                            <div key={index} className="text-center space-y-2">
                                <h3 className="text-4xl font-bold text-purple-600">{stat.value}</h3>
                                <p className="text-muted-foreground font-medium">{stat.label}</p>
                            </div>
                        )) : (
                            // Fallback stats if none
                            <div className="col-span-4 text-center text-muted-foreground">Carregando estatísticas...</div>
                        )}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                            {benefitsData.title?.text || "Por que Famílias Confiam no MedCare?"}
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {benefitsData.subtitle?.text || "Mais que um app de medicamentos."}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {benefitsList.map((benefit: any, index: number) => {
                            const Icon = iconMap[benefit.icon] || Circle;
                            return (
                                <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                    <CardContent className="p-8 space-y-6">
                                        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${benefit.color || 'from-blue-500 to-cyan-500'} flex items-center justify-center text-white shadow-lg`}>
                                            <Icon className="h-7 w-7" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900">{benefit.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {benefit.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Features Showcase */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-20 space-y-4">
                        <Badge variant="outline" className="border-purple-200 text-purple-600 px-4 py-1">Feature Highlights</Badge>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
                            {featuresData.title?.text || "Recursos Pensados para Você"}
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {featuresData.subtitle?.text || "Tudo que você precisa para cuidar da saúde da família"}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        {featuresList.map((feature: any, index: number) => {
                            const Icon = iconMap[feature.icon] || Circle;
                            return (
                                <div key={index} className="flex gap-6 p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className="shrink-0">
                                        <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                                        <p className="text-muted-foreground">{feature.description}</p>
                                        <ul className="space-y-2 pt-2">
                                            {feature.highlights?.map((highlight: string, idx: number) => (
                                                <li key={idx} className="flex items-center text-sm text-slate-600">
                                                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                                                    {highlight}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Elderly Care Use Case - Dark Section */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-900/20 to-transparent" />

                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <Badge className="bg-purple-500/20 text-purple-300 border-0">
                                {elderlyData.badge?.text || "Caso de Uso"}
                            </Badge>
                            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                                {elderlyData.title?.text || "Ideal para Idosos que Moram Sozinhos"}
                            </h2>
                            <p className="text-xl text-slate-300 leading-relaxed">
                                {elderlyData.description?.text}
                            </p>

                            <div className="grid gap-6">
                                {elderlyHighlights.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="h-5 w-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                                            <p className="text-slate-400">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700 aspect-square lg:aspect-auto h-[600px]">
                                <img
                                    src={elderlyData.image?.url || "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=600&h=600&fit=crop"}
                                    alt={elderlyData.image?.alt || "Idoso feliz"}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/10">
                                        <div className="flex gap-1 mb-3">
                                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
                                        </div>
                                        <p className="text-lg italic mb-3">"{elderlyData.testimonial?.text}"</p>
                                        <p className="text-sm font-bold text-purple-300">{elderlyData.testimonial?.author}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
                            {testimonialsData.title?.text || "O Que Nossos Usuários Dizem"}
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            {testimonialsData.subtitle?.text || "Milhares de famílias já confiam no MedCare"}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonialsList.map((testimonial: any, index: number) => (
                            <Card key={index} className="bg-slate-50 border-none shadow-sm h-full">
                                <CardContent className="p-8 flex flex-col h-full">
                                    <div className="flex gap-1 mb-6">
                                        {[...Array(testimonial.rating || 5)].map((_, i) => (
                                            <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-700 text-lg leading-relaxed mb-6 flex-grow">
                                        "{testimonial.content}"
                                    </p>
                                    <div>
                                        <p className="font-bold text-slate-900">{testimonial.name}</p>
                                        <p className="text-sm text-purple-600">{testimonial.role}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-24 bg-gradient-to-br from-purple-600 to-pink-600 text-white text-center">
                <div className="max-w-4xl mx-auto px-6 space-y-8">
                    <Crown className="h-16 w-16 mx-auto text-white/90 animate-bounce" />
                    <h2 className="text-4xl md:text-6xl font-bold leading-tight">
                        {ctaData.title?.text || "Comece a Cuidar Melhor"}<br />
                        <span className="text-purple-200">{ctaData.subtitle?.text || "Hoje Mesmo"}</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-purple-100 max-w-2xl mx-auto">
                        {ctaData.description?.text || "Junte-se a milhares de famílias que já transformaram o cuidado com a saúde"}
                    </p>
                    <div className="pt-8 space-y-4">
                        <Button
                            size="lg"
                            className="h-16 px-10 text-xl font-bold bg-white text-purple-600 hover:bg-white/90 shadow-xl"
                            onClick={() => navigate(ctaData.button?.link || '/register')}
                        >
                            {ctaData.button?.text || "Criar Conta Grátis"}
                        </Button>
                        <p className="text-sm text-purple-200">
                            {ctaData.footer_text?.text || "Sem compromisso • Cancele quando quiser"}
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12 px-6 bg-muted/30">
                <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
                    <p>© 2026 MedCare. Todos os direitos reservados.</p>
                    <p className="mt-2">Feito com ❤️ para famílias que se importam</p>
                </div>
            </footer>
        </div>
    );
}
