import { useState, useEffect } from 'react';
import { useLandingContent } from '@/hooks/useLandingContent';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function LandingPageEditor() {
    const { content, loading, updateContent, updateMultiple } = useLandingContent();
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    // Local state for form values
    const [formData, setFormData] = useState<any>({});

    // Initialize form data when content loads
    useEffect(() => {
        if (content && Object.keys(content).length > 0) {
            setFormData(content);
        }
    }, [content]);

    const handleSave = async (section: string) => {
        setSaving(true);
        try {
            const updates = Object.keys(formData[section] || {}).map(key => ({
                section,
                key,
                value: formData[section][key]
            }));

            const result = await updateMultiple(updates);

            if (result.success) {
                toast({
                    title: 'Sucesso',
                    description: 'Conteúdo atualizado com sucesso!'
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Falha ao salvar alterações',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const updateField = (section: string, key: string, field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: {
                    ...prev[section]?.[key],
                    [field]: value
                }
            }
        }));
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Editor da Landing Page</h1>
                    <p className="text-muted-foreground">Gerencie textos e imagens da página inicial</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/')}>
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar Landing Page
                </Button>
            </div>

            <Tabs defaultValue="hero" className="space-y-6">
                <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
                    <TabsTrigger value="hero">Hero</TabsTrigger>
                    <TabsTrigger value="stats">Stats</TabsTrigger>
                    <TabsTrigger value="benefits">Benefícios</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="elderly">Idosos</TabsTrigger>
                    <TabsTrigger value="testimonials">Depoimentos</TabsTrigger>
                    <TabsTrigger value="cta">CTA</TabsTrigger>
                </TabsList>

                {/* Hero Section */}
                <TabsContent value="hero">
                    <Card>
                        <CardHeader>
                            <CardTitle>Seção Hero</CardTitle>
                            <CardDescription>Edite o cabeçalho principal da landing page</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Badge</Label>
                                <Input
                                    value={formData.hero?.badge?.text || ''}
                                    onChange={(e) => updateField('hero', 'badge', 'text', e.target.value)}
                                    placeholder="Plataforma #1..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Título Principal</Label>
                                <Textarea
                                    value={formData.hero?.title?.text || ''}
                                    onChange={(e) => updateField('hero', 'title', 'text', e.target.value)}
                                    placeholder="Cuide de Quem Você Ama..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Textarea
                                    value={formData.hero?.description?.text || ''}
                                    onChange={(e) => updateField('hero', 'description', 'text', e.target.value)}
                                    placeholder="Gerencie medicamentos..."
                                    rows={4}
                                />
                            </div>

                            <ImageUploader
                                label="Imagem de Fundo"
                                currentUrl={formData.hero?.background_image?.url}
                                onUpload={(url) => updateField('hero', 'background_image', 'url', url)}
                            />

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Botão Primário - Texto</Label>
                                    <Input
                                        value={formData.hero?.cta_primary?.text || ''}
                                        onChange={(e) => updateField('hero', 'cta_primary', 'text', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Botão Primário - Link</Label>
                                    <Input
                                        value={formData.hero?.cta_primary?.link || ''}
                                        onChange={(e) => updateField('hero', 'cta_primary', 'link', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Botão Secundário - Texto</Label>
                                    <Input
                                        value={formData.hero?.cta_secondary?.text || ''}
                                        onChange={(e) => updateField('hero', 'cta_secondary', 'text', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Botão Secundário - Link</Label>
                                    <Input
                                        value={formData.hero?.cta_secondary?.link || ''}
                                        onChange={(e) => updateField('hero', 'cta_secondary', 'link', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Texto do Rodapé</Label>
                                <Input
                                    value={formData.hero?.footer_text?.text || ''}
                                    onChange={(e) => updateField('hero', 'footer_text', 'text', e.target.value)}
                                    placeholder="✓ Grátis para sempre..."
                                />
                            </div>

                            <Button onClick={() => handleSave('hero')} disabled={saving} className="w-full">
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Hero
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Stats Section */}
                <TabsContent value="stats">
                    <Card>
                        <CardHeader>
                            <CardTitle>Estatísticas</CardTitle>
                            <CardDescription>Edite os 4 números de destaque</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[1, 2, 3, 4].map((num) => (
                                <div key={num} className="grid md:grid-cols-2 gap-4 p-4 border rounded-lg">
                                    <div className="space-y-2">
                                        <Label>Valor {num}</Label>
                                        <Input
                                            value={formData.stats?.[`stat_${num}`]?.value || ''}
                                            onChange={(e) => updateField('stats', `stat_${num}`, 'value', e.target.value)}
                                            placeholder="10mil+"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Label {num}</Label>
                                        <Input
                                            value={formData.stats?.[`stat_${num}`]?.label || ''}
                                            onChange={(e) => updateField('stats', `stat_${num}`, 'label', e.target.value)}
                                            placeholder="Usuários Ativos"
                                        />
                                    </div>
                                </div>
                            ))}

                            <Button onClick={() => handleSave('stats')} disabled={saving} className="w-full">
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Stats
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Benefits Section */}
                <TabsContent value="benefits">
                    <Card>
                        <CardHeader>
                            <CardTitle>Benefícios</CardTitle>
                            <CardDescription>Edite os 3 principais benefícios</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Título da Seção</Label>
                                <Input
                                    value={formData.benefits?.title?.text || ''}
                                    onChange={(e) => updateField('benefits', 'title', 'text', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Subtítulo</Label>
                                <Textarea
                                    value={formData.benefits?.subtitle?.text || ''}
                                    onChange={(e) => updateField('benefits', 'subtitle', 'text', e.target.value)}
                                    rows={2}
                                />
                            </div>

                            {[1, 2, 3].map((num) => (
                                <div key={num} className="p-4 border rounded-lg space-y-4">
                                    <h4 className="font-semibold">Benefício {num}</h4>
                                    <div className="space-y-2">
                                        <Label>Título</Label>
                                        <Input
                                            value={formData.benefits?.[`benefit_${num}`]?.title || ''}
                                            onChange={(e) => updateField('benefits', `benefit_${num}`, 'title', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descrição</Label>
                                        <Textarea
                                            value={formData.benefits?.[`benefit_${num}`]?.description || ''}
                                            onChange={(e) => updateField('benefits', `benefit_${num}`, 'description', e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            ))}

                            <Button onClick={() => handleSave('benefits')} disabled={saving} className="w-full">
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Benefícios
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Features Section */}
                <TabsContent value="features">
                    <Card>
                        <CardHeader>
                            <CardTitle>Features</CardTitle>
                            <CardDescription>Edite os 4 recursos principais</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Título da Seção</Label>
                                <Input
                                    value={formData.features?.title?.text || ''}
                                    onChange={(e) => updateField('features', 'title', 'text', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Subtítulo</Label>
                                <Input
                                    value={formData.features?.subtitle?.text || ''}
                                    onChange={(e) => updateField('features', 'subtitle', 'text', e.target.value)}
                                />
                            </div>

                            {[1, 2, 3, 4].map((num) => (
                                <div key={num} className="p-4 border rounded-lg space-y-4">
                                    <h4 className="font-semibold">Feature {num}</h4>
                                    <div className="space-y-2">
                                        <Label>Título</Label>
                                        <Input
                                            value={formData.features?.[`feature_${num}`]?.title || ''}
                                            onChange={(e) => updateField('features', `feature_${num}`, 'title', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descrição</Label>
                                        <Textarea
                                            value={formData.features?.[`feature_${num}`]?.description || ''}
                                            onChange={(e) => updateField('features', `feature_${num}`, 'description', e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            ))}

                            <Button onClick={() => handleSave('features')} disabled={saving} className="w-full">
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Features
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Elderly Section */}
                <TabsContent value="elderly">
                    <Card>
                        <CardHeader>
                            <CardTitle>Caso de Uso - Idosos</CardTitle>
                            <CardDescription>Edite a seção dedicada ao público idoso</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Badge</Label>
                                <Input
                                    value={formData.elderly?.badge?.text || ''}
                                    onChange={(e) => updateField('elderly', 'badge', 'text', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Título</Label>
                                <Input
                                    value={formData.elderly?.title?.text || ''}
                                    onChange={(e) => updateField('elderly', 'title', 'text', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Textarea
                                    value={formData.elderly?.description?.text || ''}
                                    onChange={(e) => updateField('elderly', 'description', 'text', e.target.value)}
                                    rows={4}
                                />
                            </div>

                            <ImageUploader
                                label="Imagem"
                                currentUrl={formData.elderly?.image?.url}
                                onUpload={(url) => updateField('elderly', 'image', 'url', url)}
                            />

                            <div className="space-y-2">
                                <Label>Depoimento</Label>
                                <Textarea
                                    value={formData.elderly?.testimonial?.text || ''}
                                    onChange={(e) => updateField('elderly', 'testimonial', 'text', e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Autor do Depoimento</Label>
                                <Input
                                    value={formData.elderly?.testimonial?.author || ''}
                                    onChange={(e) => updateField('elderly', 'testimonial', 'author', e.target.value)}
                                />
                            </div>

                            <Button onClick={() => handleSave('elderly')} disabled={saving} className="w-full">
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Seção Idosos
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Testimonials Section */}
                <TabsContent value="testimonials">
                    <Card>
                        <CardHeader>
                            <CardTitle>Depoimentos</CardTitle>
                            <CardDescription>Edite os 3 depoimentos de usuários</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Título da Seção</Label>
                                <Input
                                    value={formData.testimonials?.title?.text || ''}
                                    onChange={(e) => updateField('testimonials', 'title', 'text', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Subtítulo</Label>
                                <Input
                                    value={formData.testimonials?.subtitle?.text || ''}
                                    onChange={(e) => updateField('testimonials', 'subtitle', 'text', e.target.value)}
                                />
                            </div>

                            {[1, 2, 3].map((num) => (
                                <div key={num} className="p-4 border rounded-lg space-y-4">
                                    <h4 className="font-semibold">Depoimento {num}</h4>
                                    <div className="space-y-2">
                                        <Label>Nome</Label>
                                        <Input
                                            value={formData.testimonials?.[`testimonial_${num}`]?.name || ''}
                                            onChange={(e) => updateField('testimonials', `testimonial_${num}`, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cargo/Função</Label>
                                        <Input
                                            value={formData.testimonials?.[`testimonial_${num}`]?.role || ''}
                                            onChange={(e) => updateField('testimonials', `testimonial_${num}`, 'role', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Depoimento</Label>
                                        <Textarea
                                            value={formData.testimonials?.[`testimonial_${num}`]?.content || ''}
                                            onChange={(e) => updateField('testimonials', `testimonial_${num}`, 'content', e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            ))}

                            <Button onClick={() => handleSave('testimonials')} disabled={saving} className="w-full">
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Depoimentos
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CTA Section */}
                <TabsContent value="cta">
                    <Card>
                        <CardHeader>
                            <CardTitle>Call to Action Final</CardTitle>
                            <CardDescription>Edite a chamada para ação final</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Título</Label>
                                <Input
                                    value={formData.cta?.title?.text || ''}
                                    onChange={(e) => updateField('cta', 'title', 'text', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Subtítulo</Label>
                                <Input
                                    value={formData.cta?.subtitle?.text || ''}
                                    onChange={(e) => updateField('cta', 'subtitle', 'text', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Textarea
                                    value={formData.cta?.description?.text || ''}
                                    onChange={(e) => updateField('cta', 'description', 'text', e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Texto do Botão</Label>
                                    <Input
                                        value={formData.cta?.button?.text || ''}
                                        onChange={(e) => updateField('cta', 'button', 'text', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Link do Botão</Label>
                                    <Input
                                        value={formData.cta?.button?.link || ''}
                                        onChange={(e) => updateField('cta', 'button', 'link', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Texto do Rodapé</Label>
                                <Input
                                    value={formData.cta?.footer_text?.text || ''}
                                    onChange={(e) => updateField('cta', 'footer_text', 'text', e.target.value)}
                                />
                            </div>

                            <Button onClick={() => handleSave('cta')} disabled={saving} className="w-full">
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar CTA
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
