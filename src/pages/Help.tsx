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
    Calendar
} from 'lucide-react';

const guides = [
    {
        id: 'meds',
        title: 'Adicionar Medicamentos',
        icon: Pill,
        color: 'text-blue-400',
        steps: [
            'Toque no botão "+" na tela inicial ou aba de medicamentos.',
            'Escaneie a caixa do remédio ou digite o nome manualmente.',
            'Defina a frequência (ex: 8 em 8 horas) e a duração.',
            'Para xaropes e gotas, o controle de estoque é automático.'
        ]
    },
    {
        id: 'share',
        title: 'Compartilhar Perfil',
        icon: Share2,
        color: 'text-purple-400',
        steps: [
            'Vá em Configurações > Família.',
            'Escolha o perfil do dependente que deseja compartilhar.',
            'Toque no ícone de compartilhamento ao lado do nome.',
            'Defina o tempo de acesso (ex: 24 horas ou 7 dias) e envie o link.'
        ]
    },
    {
        id: 'panic',
        title: 'Botão de Pânico',
        icon: AlertTriangle,
        color: 'text-red-400',
        steps: [
            'Em caso de emergência, pressione o botão vermelho na tela inicial.',
            'Seus contatos de emergência receberão um alerta SMS/WhatsApp.',
            'Sua localização atual será enviada em tempo real.'
        ]
    },
    {
        id: 'dependents',
        title: 'Adicionar Dependentes',
        icon: UserPlus,
        color: 'text-green-400',
        steps: [
            'Acesse Configurações > Perfil.',
            'Clique em "Adicionar Dependente".',
            'Preencha os dados básicos (Nome, Data de Nascimento).',
            'Agora você pode gerenciar os remédios dele separadamente.'
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
                    Explore nossos guias interativos para aproveitar o máximo do MedCare.
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
                                                        <div key={i} className="flex gap-3 text-muted-foreground">
                                                            <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                                            <p>{step}</p>
                                                        </div>
                                                    ))}
                                                    <div className="pt-2">
                                                        <NeoButton className="w-full text-sm py-2">Ver Tutorial Completo</NeoButton>
                                                    </div>
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
