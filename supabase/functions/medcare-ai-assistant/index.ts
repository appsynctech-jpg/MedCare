
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_PROMPT = `Você é o Guia MedCare. Ajude usuários a navegar no app. Responda em Português.`;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { message } = await req.json();

        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não configurada.');

        // 1. Buscar System Prompt Dinâmico do Banco
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        const { data: settings } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'ai_assistant_config')
            .single();

        let systemPrompt = DEFAULT_PROMPT;
        let preferredModel = "gemini-1.5-flash";

        if (settings?.value) {
            // O valor é um JSONB, o supabase-js já deve parsear, mas garantimos
            const config = typeof settings.value === 'string' ? JSON.parse(settings.value) : settings.value;
            if (config.prompt) systemPrompt = config.prompt;
            if (config.model) preferredModel = config.model;
        }

        // 2. Chamar Gemini com Fallback (Ordem solicitada: 2.5 -> 1.5 -> Pro)
        const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-pro"];

        // Se houver um modelo preferencial no banco que não esteja na lista, adicionamos no início
        if (preferredModel && !modelsToTry.includes(preferredModel)) {
            modelsToTry.unshift(preferredModel);
        }

        const uniqueModels = [...new Set(modelsToTry)];

        let aiResponseText = '';
        let lastError = null;
        let success = false;

        console.log(`Recebendo mensagem: ${message}`);
        console.log(`Usando prompt do sistema (início): ${systemPrompt.substring(0, 50)}...`);

        for (const modelName of uniqueModels) {
            if (success) break;

            try {
                console.log(`Tentando modelo: ${modelName}`);

                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            role: 'user',
                            parts: [{ text: `${systemPrompt}\n\nPERGUNTA DO USUÁRIO: "${message}"` }]
                        }]
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    // Se der 404/400 pode ser modelo inexistente ou erro de formato, tentamos o próximo
                    throw new Error(`Erro API Gemini (${modelName}): ${data.error?.message || response.statusText}`);
                }

                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error('Resposta vazia da IA');

                aiResponseText = text;
                success = true;

            } catch (error) {
                console.warn(`Falha no modelo ${modelName}:`, error);
                lastError = error;
            }
        }

        if (!success) {
            throw lastError || new Error('Falha ao conectar com todos os modelos de IA.');
        }

        return new Response(JSON.stringify({ reply: aiResponseText }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Erro na Edge Function:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
