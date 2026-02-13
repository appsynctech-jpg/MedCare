import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaywallModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    feature: 'dependent' | 'medication' | 'document' | 'share' | 'emergency_contact' | 'export';
    currentCount?: number;
    limit?: number;
}

const FEATURE_MESSAGES = {
    dependent: {
        title: 'Adicione mais dependentes',
        description: 'Gerencie até 5 perfis familiares com o plano Pro!',
        icon: '👥'
    },
    medication: {
        title: 'Medicamentos ilimitados',
        description: 'Adicione quantos medicamentos precisar sem limites!',
        icon: '💊'
    },
    document: {
        title: 'Armazenamento ilimitado',
        description: 'Guarde todos os seus documentos médicos sem se preocupar com espaço!',
        icon: '📄'
    },
    share: {
        title: 'Compartilhe com cuidadores',
        description: 'Compartilhe seus dados médicos com médicos e cuidadores de forma segura!',
        icon: '🔗'
    },
    emergency_contact: {
        title: 'Mais contatos de emergência',
        description: 'Adicione até 5 contatos de emergência para maior segurança!',
        icon: '🚨'
    },
    export: {
        title: 'Exporte relatórios',
        description: 'Gere relatórios em PDF para levar às consultas médicas!',
        icon: '📊'
    }
};

export const PaywallModal = ({ open, onOpenChange, feature, currentCount, limit }: PaywallModalProps) => {
    const navigate = useNavigate();
    const message = FEATURE_MESSAGES[feature];

    const handleUpgrade = () => {
        onOpenChange(false);
        navigate('/pricing');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <DialogTitle>Recurso Pro {message.icon}</DialogTitle>
                    </div>
                    <DialogDescription className="text-base">
                        {message.description}
                    </DialogDescription>
                </DialogHeader>

                {currentCount !== undefined && limit !== undefined && (
                    <div className="bg-muted rounded-lg p-3 mb-4">
                        <p className="text-sm text-muted-foreground">
                            Você atingiu o limite do plano Free: <span className="font-semibold">{currentCount}/{limit}</span>
                        </p>
                    </div>
                )}

                <div className="space-y-3 my-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">Apenas R$ 9,90/mês</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">14 dias grátis para experimentar</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">Cancele quando quiser</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                        Agora não
                    </Button>
                    <Button onClick={handleUpgrade} className="flex-1">
                        Experimentar Pro Grátis
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
