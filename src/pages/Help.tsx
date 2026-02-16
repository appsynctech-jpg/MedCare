import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeoCard, NeoButton, NeoToggle } from '@/components/ui/neo-kit';
import {
    Pill,
    Share2,
    AlertTriangle,
    UserPlus,
    ChevronRight,
    Search,
    CheckCircle2,
    Calendar,
    ShieldCheck,
    Stethoscope
} from 'lucide-react';

const guides = [
    {
        id: 'meds',
        title: 'Adicionar Medicamentos',
        icon: Pill,
        color: 'text-blue-400',
        steps: [
            'Na tela inicial ou na aba "Medicamentos", procure e toque no botão "+" ou "Adicionar Medicamento".',
            'Você pode usar a câmera para escanear a caixa do remédio ou digitar o nome manualmente no campo indicado.',
            'Preencha a dosagem (ex: 500mg) e a forma farmacêutica (comprimido, xarope, etc).',
            'Defina a frequência de uso (ex: de 8 em 8 horas) e configure os horários das doses.',
            'Para medicamentos contínuos, marque a opção "Uso contínuo". Para tratamentos com data de fim, selecione a data de término.',
            'O sistema calcula automaticamente o estoque e avisa quando estiver acabando (exceto para líquidos).'
        ]
    },
    {
        id: 'share',
        title: 'Compartilhar Perfil',
        icon: Share2,
        color: 'text-purple-400',
        steps: [
            'Acesse o menu de "Configurações" e vá até a aba "Família".',
            'Localize o perfil do dependente que você deseja compartilhar na lista.',
            'Toque no ícone de compartilhamento (seta) ao lado do nome do dependente.',
            'Escolha quais informações deseja compartilhar (Medicações, Consultas, etc).',
            'Defina a validade do link (ex: 24 horas, 7 dias ou acesso permanente) e gere o link.',
            'Envie o link gerado via WhatsApp ou E-mail para o cuidador ou médico.'
        ]
    },
    {
        id: 'panic',
        title: 'Botão de Pânico',
        icon: AlertTriangle,
        color: 'text-red-400',
        steps: [
            'O botão de pânico está localizado no topo da tela inicial (ícone de alerta vermelho).',
            'Em caso de emergência, mantenha o botão pressionado por alguns segundos.',
            'O sistema enviará automaticamente um alerta para seus contatos de emergência cadastrados.',
            'A mensagem incluirá sua localização atual em tempo real para facilitar o socorro.'
        ]
    },
    {
        id: 'monitoring',
        title: 'Como Receber Alertas',
        icon: ShieldCheck,
        color: 'text-indigo-400',
        steps: [
            'Para que um familiar receba seus alertas de pânico com notificação em tempo real, ele obrigatoriamente precisa ter o MedCare instalado no celular dele.',
            'Você deve enviar um convite para ele em "Configurações" > "Família" usando o e-mail que ele cadastrou no app.',
            'O familiar precisa aceitar o convite no painel dele para validar o vínculo de monitoramento.',
            'Certifique-se de que ele autorizou as "Notificações" nas configurações do celular para que os alertas apareçam mesmo com o app fechado.',
            'Uma vez aceito, ele passará a receber um som de sirene imediato sempre que você acionar o pânico.'
        ]
    },
    {
        id: 'dependents',
        title: 'Adicionar Dependentes',
        icon: UserPlus,
        color: 'text-green-400',
        steps: [
            'Vá até "Configurações" e selecione a seção "Perfil" ou "Família".',
            'Clique no botão "Adicionar Dependente" ou "Novo Perfil".',
            'Insira as informações básicas: Nome completo, Data de Nascimento e relação de parentesco.',
            'Após salvar, você poderá alternar entre os perfis no menu lateral para gerenciar os medicamentos de cada um individualmente.'
        ]
    },
    {
        id: 'doctors',
        title: 'Gerenciar Médicos',
        icon: Stethoscope,
        color: 'text-cyan-400',
        steps: [
            'Existem duas formas de cadastrar: Completa ou Rápida.',
            'Cadastro Completo: Vá em "Médicos" > "Adicionar Médico". Aqui você salva todas as informações (telefone, endereço, etc).',
            'Cadastro Rápido: Ao agendar uma "Nova Consulta", se você digitar um nome de médico que não existe, ele será criado automaticamente.',
            'Atenção: O cadastro rápido salva apenas o Nome e Especialidade.',
            'Para completar o cadastro (adicionar telefone/endereço) de um médico criado rapidamente, vá até a aba "Médicos" e clique no ícone de editar.'
        ]
    }
];

export default function Help() {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');


    const filteredGuides = guides.filter(g =>
        g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.steps.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-background p-4 sm:p-8 space-y-8 pb-24">

            {/* Header Section */}
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Como podemos ajudar?
                </h1>
                <p className="text-muted-foreground text-lg">
                    Explore nossos guias detalhados para aproveitar o máximo do MedCare.
                </p>

                {/* Neo-Tactile Search */}
                <div className="relative group max-w-md">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground/50 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar ajuda..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-[20px] bg-muted/20 border border-white/5 focus:border-blue-500/30 focus:bg-muted/30 outline-none transition-all shadow-inner text-lg"
                    />
                </div>
            </div>

            {/* Guides Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                    {filteredGuides.map((guide, index) => (
                        <motion.div
                            key={guide.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <NeoCard
                                className={`h-full transition-all duration-300 ${activeTab === guide.id ? 'ring-2 ring-blue-500/50 shadow-blue-500/20' : 'hover:bg-white/10'}`}
                                onClick={() => setActiveTab(activeTab === guide.id ? null : guide.id)}
                            >
                                <div className="p-6 space-y-4 cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl bg-white/5 ${guide.color} shadow-inner`}>
                                                <guide.icon className="h-6 w-6" />
                                            </div>
                                            <h3 className="text-xl font-semibold">{guide.title}</h3>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: activeTab === guide.id ? 90 : 0 }}
                                            className="text-muted-foreground"
                                        >
                                            <ChevronRight className="h-6 w-6" />
                                        </motion.div>
                                    </div>

                                    <AnimatePresence>
                                        {activeTab === guide.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-4 space-y-4 border-t border-white/10 mt-4">
                                                    {guide.steps.map((step, i) => (
                                                        <div key={i} className="flex gap-3 text-muted-foreground items-start">
                                                            <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                                            <p className="leading-relaxed">{step}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </NeoCard>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
