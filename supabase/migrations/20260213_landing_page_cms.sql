-- Landing Page CMS Migration
-- Allows admin users to manage landing page content through database

-- Add role column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create landing_content table
CREATE TABLE IF NOT EXISTS landing_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE(section, key)
);

-- Enable RLS
ALTER TABLE landing_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view landing content
CREATE POLICY "Anyone can view landing content"
  ON landing_content FOR SELECT
  USING (true);

-- Only admins can modify landing content
CREATE POLICY "Only admins can modify landing content"
  ON landing_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seed initial content from current landing page
INSERT INTO landing_content (section, key, value) VALUES
-- Hero Section
('hero', 'badge', '{"text": "Plataforma #1 em Gestão de Saúde Familiar"}'),
('hero', 'title', '{"text": "Cuide de Quem Você Ama,\nMesmo à Distância"}'),
('hero', 'description', '{"text": "Gerencie medicamentos, consultas e saúde de toda a família em um só lugar. Ideal para idosos, cuidadores e famílias que querem tranquilidade."}'),
('hero', 'background_image', '{"url": "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=1920&h=1080&fit=crop&q=80", "alt": "Idoso feliz usando smartphone"}'),
('hero', 'cta_primary', '{"text": "Começar Grátis", "link": "/register"}'),
('hero', 'cta_secondary', '{"text": "Ver Planos", "link": "/pricing"}'),
('hero', 'footer_text', '{"text": "✓ Grátis para sempre • ✓ Sem cartão de crédito • ✓ Cancele quando quiser"}'),

-- Stats Section
('stats', 'stat_1', '{"value": "10mil+", "label": "Usuários Ativos"}'),
('stats', 'stat_2', '{"value": "50mil+", "label": "Medicamentos Gerenciados"}'),
('stats', 'stat_3', '{"value": "99.9%", "label": "Uptime"}'),
('stats', 'stat_4', '{"value": "4.9★", "label": "Avaliação"}'),

-- Benefits Section
('benefits', 'title', '{"text": "Por que Famílias Confiam no MedCare?"}'),
('benefits', 'subtitle', '{"text": "Mais que um app de medicamentos. É tranquilidade para você e cuidado para quem você ama."}'),
('benefits', 'benefit_1', '{"icon": "Clock", "title": "Economize Tempo", "description": "Gerencie todos os medicamentos da família em um só lugar. Sem mais planilhas ou lembretes esquecidos.", "color": "from-blue-500 to-cyan-500"}'),
('benefits', 'benefit_2', '{"icon": "DollarSign", "title": "Economize Dinheiro", "description": "Evite desperdício de medicamentos. Controle de estoque inteligente e alertas de reposição.", "color": "from-green-500 to-emerald-500"}'),
('benefits', 'benefit_3', '{"icon": "Heart", "title": "Tenha Tranquilidade", "description": "Acompanhe o tratamento dos seus entes queridos à distância. Alertas em tempo real de pânico e medicações.", "color": "from-purple-500 to-pink-500"}'),

-- Features Section
('features', 'title', '{"text": "Recursos Pensados para Você"}'),
('features', 'subtitle', '{"text": "Tudo que você precisa para cuidar da saúde da família"}'),
('features', 'feature_1', '{"icon": "Users", "title": "Perfis Familiares", "description": "Crie perfis para cada membro da família. Gerencie medicamentos, consultas e documentos de todos em um só app.", "highlights": ["Perfis ilimitados no Pro", "Troca rápida entre perfis", "Dados isolados e seguros"]}'),
('features', 'feature_2', '{"icon": "Shield", "title": "Monitoramento Remoto", "description": "Ideal para idosos que moram sozinhos. Monitore se tomaram os medicamentos e receba alertas de emergência.", "highlights": ["Alertas em tempo real", "Botão de pânico SOS", "Histórico completo"]}'),
('features', 'feature_3', '{"icon": "Bell", "title": "Alertas Inteligentes", "description": "Notificações personalizadas para cada medicamento. Nunca mais esqueça um horário importante.", "highlights": ["Horários personalizados", "Lembretes recorrentes", "Controle de estoque"]}'),
('features', 'feature_4', '{"icon": "Share2", "title": "Compartilhamento Seguro", "description": "Compartilhe informações médicas com cuidadores, médicos e familiares de forma segura e controlada.", "highlights": ["Links temporários", "Permissões granulares", "Revogação instantânea"]}'),

-- Elderly Use Case Section
('elderly', 'badge', '{"text": "Caso de Uso"}'),
('elderly', 'title', '{"text": "Ideal para Idosos que Moram Sozinhos"}'),
('elderly', 'description', '{"text": "Seus pais ou avós moram longe? Com o MedCare, você pode criar um perfil para eles e monitorar tudo remotamente. Receba alertas se não tomarem os medicamentos e tenha acesso ao histórico completo de saúde."}'),
('elderly', 'image', '{"url": "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=600&h=600&fit=crop", "alt": "Idoso usando smartphone"}'),
('elderly', 'testimonial', '{"text": "Agora consigo acompanhar minha mãe de 78 anos que mora em outra cidade. Tenho paz de espírito!", "author": "Ana, filha de usuária"}'),
('elderly', 'highlight_1', '{"title": "Monitoramento em Tempo Real", "description": "Veja quando tomaram os medicamentos, mesmo à distância"}'),
('elderly', 'highlight_2', '{"title": "Botão de Pânico SOS", "description": "Em emergências, você é notificado instantaneamente"}'),
('elderly', 'highlight_3', '{"title": "Compartilhe com Cuidadores", "description": "Dê acesso controlado para enfermeiros e familiares"}'),

-- Testimonials Section
('testimonials', 'title', '{"text": "O Que Nossos Usuários Dizem"}'),
('testimonials', 'subtitle', '{"text": "Milhares de famílias já confiam no MedCare"}'),
('testimonials', 'testimonial_1', '{"name": "Maria Silva", "role": "Filha de paciente", "content": "Minha mãe mora sozinha e sempre esquecia os remédios. Com o MedCare, recebo alertas e posso acompanhar tudo à distância. Mudou nossa vida!", "rating": 5}'),
('testimonials', 'testimonial_2', '{"name": "Dr. João Santos", "role": "Geriatra", "content": "Recomendo para todos os meus pacientes idosos. A adesão ao tratamento melhorou significativamente.", "rating": 5}'),
('testimonials', 'testimonial_3', '{"name": "Carlos Oliveira", "role": "Cuidador profissional", "content": "Gerencio 5 pacientes e o MedCare facilita muito meu trabalho. Tudo organizado e com alertas automáticos.", "rating": 5}'),

-- CTA Section
('cta', 'title', '{"text": "Comece a Cuidar Melhor"}'),
('cta', 'subtitle', '{"text": "Hoje Mesmo"}'),
('cta', 'description', '{"text": "Junte-se a milhares de famílias que já transformaram o cuidado com a saúde"}'),
('cta', 'button', '{"text": "Criar Conta Grátis", "link": "/register"}'),
('cta', 'footer_text', '{"text": "Sem compromisso • Cancele quando quiser"}')

ON CONFLICT (section, key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_landing_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_landing_content_timestamp ON landing_content;
CREATE TRIGGER update_landing_content_timestamp
  BEFORE UPDATE ON landing_content
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_content_timestamp();
