import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeoCard, NeoButton } from '@/components/ui/neo-kit';
import {
    MessageCircle,
    X,
    Send,
    Sparkles,
    Bot,
    User,
    Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'assistant' | 'user';
    content: string;
}

export default function AssistantChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Olá! Sou seu guia do MedCare. Como posso te ajudar a usar o sistema hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);

        // Chamada Real à Edge Function
        try {
            const { data, error } = await supabase.functions.invoke('medcare-ai-assistant', {
                body: { message: userMsg }
            });

            if (error) throw error;

            const aiReply = data?.reply || "Desculpe, não consegui processar sua resposta agora. Tente novamente mais tarde.";

            setMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
        } catch (error) {
            console.error('Erro no chat:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Estou tendo problemas de conexão. Por favor, verifique sua internet ou tente mais tarde."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="mb-4 w-[350px] sm:w-[400px]"
                    >
                        {/* Chat Container - Raw div with glassmorphism + proper flex/scroll */}
                        <div className="relative rounded-[32px] bg-white/5 dark:bg-black/20 backdrop-blur-2xl border border-white/10 dark:border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] h-[500px] flex flex-col overflow-hidden">
                            {/* Glassmorphism gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none rounded-[32px]" />
                            {/* Header - Shrink to fit */}
                            <div className="shrink-0 p-4 border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary rounded-xl">
                                        <Bot className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">MedCare Guia</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Online para ajudar</span>
                                        </div>
                                    </div>
                                </div>
                                <NeoButton
                                    variant="ghost"
                                    className="rounded-full h-8 w-8 p-0"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </NeoButton>
                            </div>

                            {/* Messages - This is the scrollable area */}
                            <div
                                ref={scrollRef}
                                className="flex-1 min-h-0 overflow-y-scroll p-4 space-y-4 custom-scrollbar"
                                style={{ overscrollBehavior: 'contain' }}
                            >
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`mt-1 p-1 rounded-full shrink-0 h-8 w-8 flex items-center justify-center ${msg.role === 'assistant' ? 'bg-blue-500/20' : 'bg-primary/20'}`}>
                                                {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                            </div>
                                            <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                : 'bg-muted/80 rounded-tl-none border border-white/5'
                                                }`}>
                                                {msg.role === 'assistant' ? (
                                                    <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed max-w-none">
                                                        <ReactMarkdown
                                                            components={{
                                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                                ul: ({ node, ...props }) => <ul className="list-disc mb-2 pl-4" {...props} />,
                                                                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                                strong: ({ node, ...props }) => <span className="font-bold text-blue-400" {...props} />
                                                            }}
                                                        >
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                            <span className="text-xs text-muted-foreground italic">Digitando...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input - Shrink to fit */}
                            <div className="shrink-0 p-4 border-t border-white/5 bg-muted/20">
                                <div className="relative flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Pergunte como usar..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        className="flex-1 bg-background/50 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500/50 transition-all"
                                    />
                                    <NeoButton
                                        onClick={handleSendMessage}
                                        disabled={!input.trim() || isTyping}
                                        className="rounded-xl h-9 w-9 p-0"
                                    >
                                        <Send className="h-4 w-4" />
                                    </NeoButton>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-3xl shadow-2xl flex items-center gap-2 transition-all duration-500 ${isOpen
                    ? 'bg-muted text-foreground translate-y-2'
                    : 'bg-primary text-primary-foreground'
                    }`}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
                {!isOpen && <span className="font-semibold pr-2 hidden sm:inline">Dúvidas?</span>}
                <Sparkles className="h-4 w-4 animate-pulse text-yellow-300" />
            </motion.button>
        </div>
    );
}
