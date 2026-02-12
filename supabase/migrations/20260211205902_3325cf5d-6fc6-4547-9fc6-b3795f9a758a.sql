
-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  birth_date DATE,
  phone TEXT,
  emergency_info JSONB DEFAULT '{"allergies": [], "blood_type": null, "chronic_conditions": []}'::jsonb,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'high-contrast')),
  font_size TEXT DEFAULT 'md' CHECK (font_size IN ('sm', 'md', 'lg', 'xl')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medications
CREATE TABLE public.medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  form TEXT CHECK (form IN ('comprimido', 'capsula', 'xarope', 'gotas', 'injecao', 'pomada')),
  manufacturer TEXT,
  photo_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  daily_frequency INTEGER NOT NULL CHECK (daily_frequency > 0 AND daily_frequency <= 6),
  start_date DATE NOT NULL,
  end_date DATE,
  instructions TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medication schedules
CREATE TABLE public.medication_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medication logs
CREATE TABLE public.medication_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  schedule_id UUID REFERENCES public.medication_schedules(id) ON DELETE CASCADE NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  taken_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'missed', 'skipped')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors
CREATE TABLE public.doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  crm TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('consultation', 'exam', 'return')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  preparations TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical documents
CREATE TABLE public.medical_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('exam', 'prescription', 'report', 'vaccine', 'certificate')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  document_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emergency contacts
CREATE TABLE public.emergency_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Panic logs
CREATE TABLE public.panic_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  message TEXT NOT NULL,
  contacts_notified JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shared access
CREATE TABLE public.shared_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  shared_with_email TEXT NOT NULL,
  access_token TEXT NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '{"medications": false, "appointments": false, "documents": false}'::jsonb,
  access_level TEXT NOT NULL CHECK (access_level IN ('read', 'write')),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_medications_user ON medications(user_id);
CREATE INDEX idx_schedules_medication ON medication_schedules(medication_id);
CREATE INDEX idx_logs_medication ON medication_logs(medication_id);
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_documents_user ON medical_documents(user_id);
CREATE INDEX idx_emergency_user ON emergency_contacts(user_id);
CREATE INDEX idx_panic_user ON panic_logs(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE panic_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_access ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Medications RLS
CREATE POLICY "Users can view own medications" ON medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medications" ON medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medications" ON medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medications" ON medications FOR DELETE USING (auth.uid() = user_id);

-- Medication schedules RLS
CREATE POLICY "Users can view own schedules" ON medication_schedules FOR SELECT
  USING (EXISTS (SELECT 1 FROM medications WHERE medications.id = medication_schedules.medication_id AND medications.user_id = auth.uid()));
CREATE POLICY "Users can insert own schedules" ON medication_schedules FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM medications WHERE medications.id = medication_schedules.medication_id AND medications.user_id = auth.uid()));
CREATE POLICY "Users can update own schedules" ON medication_schedules FOR UPDATE
  USING (EXISTS (SELECT 1 FROM medications WHERE medications.id = medication_schedules.medication_id AND medications.user_id = auth.uid()));
CREATE POLICY "Users can delete own schedules" ON medication_schedules FOR DELETE
  USING (EXISTS (SELECT 1 FROM medications WHERE medications.id = medication_schedules.medication_id AND medications.user_id = auth.uid()));

-- Medication logs RLS
CREATE POLICY "Users can view own logs" ON medication_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM medications WHERE medications.id = medication_logs.medication_id AND medications.user_id = auth.uid()));
CREATE POLICY "Users can insert own logs" ON medication_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM medications WHERE medications.id = medication_logs.medication_id AND medications.user_id = auth.uid()));
CREATE POLICY "Users can update own logs" ON medication_logs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM medications WHERE medications.id = medication_logs.medication_id AND medications.user_id = auth.uid()));

-- Doctors RLS
CREATE POLICY "Users can view own doctors" ON doctors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own doctors" ON doctors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own doctors" ON doctors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own doctors" ON doctors FOR DELETE USING (auth.uid() = user_id);

-- Appointments RLS
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own appointments" ON appointments FOR DELETE USING (auth.uid() = user_id);

-- Medical documents RLS
CREATE POLICY "Users can view own documents" ON medical_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON medical_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON medical_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON medical_documents FOR DELETE USING (auth.uid() = user_id);

-- Emergency contacts RLS
CREATE POLICY "Users can view own contacts" ON emergency_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON emergency_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON emergency_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON emergency_contacts FOR DELETE USING (auth.uid() = user_id);

-- Panic logs RLS
CREATE POLICY "Users can view own panic logs" ON panic_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own panic logs" ON panic_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shared access RLS
CREATE POLICY "Users can view own shares" ON shared_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shares" ON shared_access FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shares" ON shared_access FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shares" ON shared_access FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-documents', 'medical-documents', false);

CREATE POLICY "Users can upload own docs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own docs" ON storage.objects FOR DELETE
  USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
