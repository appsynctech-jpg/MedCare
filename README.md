# MedCare 🚨🏥

MedCare é um assistente pessoal de saúde digital projetado para facilitar o gerenciamento de medicamentos, consultas e monitoramento familiar em tempo real.

## 🌟 Principais Funcionalidades

- **Monitoramento Familiar (SOS)**: Sistema de alerta de pânico em tempo real com prioridade máxima.
- **Gestão de Medicamentos**: Alarmes inteligentes, histórico de adesão e notificações nativas.
- **Agenda de Consultas**: Controle completo de consultas médicas com anexos e anotações.
- **Modo Cuidador**: Visualize e gerencie a saúde de seus familiares à distância.
- **Relatórios de Saúde**: Compartilhamento seguro de histórico de adesão com médicos.

## 🚀 Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Vite.
- **Estilização**: Tailwind CSS, shadcn/ui.
- **Backend & Realtime**: Supabase.
- **Mobile**: Capacitor (Suporte Android/iOS).
- **PWA**: Notificações e funcionamento offline.

## 🛠️ Como Iniciar o Projeto

### Pré-requisitos
- Node.js (v18+)
- NPM ou Bun

### Instalação

```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente (.env)
VITE_SUPABASE_URL=seu_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

## 📱 Instalação Mobile

Para converter o projeto em um app nativo:

```bash
# Gere o build do projeto
npm run build

# Sincronize com o Capacitor
npx cap sync android
```

## 📄 Licença
Este projeto é privado e de uso exclusivo para o gerenciamento de saúde pessoal e familiar.
