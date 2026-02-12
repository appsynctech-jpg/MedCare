import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, Loader2, ArrowLeft, MailCheck } from 'lucide-react';

const forgotPasswordSchema = z.object({
    email: z.string().email('Email inválido'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const { toast } = useToast();

    const form = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/login`,
            });

            if (error) throw error;

            setIsSent(true);
            toast({
                title: 'Email enviado!',
                description: 'Verifique sua caixa de entrada para redefinir sua senha.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao solicitar recuperação',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
            <div
                className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat p-4 relative"
                style={{ backgroundImage: 'url("/fundo.png")' }}
            >
                {/* Overlay to ensure readability - tinted but clear */}
                <div className="absolute inset-0 bg-background/40"></div>

                <Card className="w-full max-w-md shadow-xl text-center relative z-10 border-primary/20 bg-card/90 backdrop-blur-sm">
                    <CardHeader className="space-y-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <MailCheck className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">Verifique seu email</CardTitle>
                        <CardDescription>
                            Enviamos instruções de recuperação de senha para o seu endereço de email.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full" asChild>
                            <Link to="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Login
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div
            className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat p-4 relative"
            style={{ backgroundImage: 'url("/fundo.png")' }}
        >
            {/* Overlay to ensure readability - tinted but clear */}
            <div className="absolute inset-0 bg-background/40"></div>

            <Card className="w-full max-w-md shadow-xl relative z-10 border-primary/20 bg-card/90 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto flex items-center justify-center p-2">
                        <img src="/MedCare.png" alt="MedCare Logo" className="h-28 w-auto object-contain" />
                    </div>
                    <CardTitle className="text-2xl pt-2">Recuperar Senha</CardTitle>
                    <CardDescription>
                        Digite seu email e enviaremos um link para você redefinir sua senha.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input type="email" placeholder="seu@email.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar Link de Recuperação
                            </Button>
                        </form>
                    </Form>
                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-sm text-primary hover:underline flex items-center justify-center font-medium">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
