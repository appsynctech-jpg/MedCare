-- Subscription System Implementation
-- Phase 1: Database Schema

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'canceled', 'expired')),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  has_storage_addon BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add subscription column to profiles
ALTER TABLE public.profiles
ADD COLUMN subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro'));

-- Indexes for performance
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_type);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON subscriptions 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON subscriptions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create free subscription on user signup
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_subscription();

-- Function to check document retention and archive old documents
CREATE OR REPLACE FUNCTION public.archive_expired_documents()
RETURNS void AS $$
DECLARE
  free_retention_days INTEGER := 180;  -- 6 months
  pro_retention_days INTEGER := 730;   -- 24 months
BEGIN
  -- Archive documents for free users (older than 6 months)
  UPDATE public.medical_documents
  SET archived = true
  WHERE user_id IN (
    SELECT p.id FROM public.profiles p
    JOIN public.subscriptions s ON s.user_id = p.id
    WHERE s.plan_type = 'free'
  )
  AND created_at < NOW() - (free_retention_days || ' days')::INTERVAL
  AND archived IS NOT true;

  -- Archive documents for pro users without storage addon (older than 24 months)
  UPDATE public.medical_documents
  SET archived = true
  WHERE user_id IN (
    SELECT p.id FROM public.profiles p
    JOIN public.subscriptions s ON s.user_id = p.id
    WHERE s.plan_type = 'pro' AND s.has_storage_addon = false
  )
  AND created_at < NOW() - (pro_retention_days || ' days')::INTERVAL
  AND archived IS NOT true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add archived column to medical_documents if not exists
ALTER TABLE public.medical_documents
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Create index for archived documents
CREATE INDEX IF NOT EXISTS idx_documents_archived ON medical_documents(archived);
