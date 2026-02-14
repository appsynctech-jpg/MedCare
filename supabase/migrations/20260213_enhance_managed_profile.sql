-- Adicionar coluna relationship se não existir
ALTER TABLE public.caregiver_relationships ADD COLUMN IF NOT EXISTS relationship TEXT;

-- Enhance create_managed_profile to accept birth_date and relationship

CREATE OR REPLACE FUNCTION public.create_managed_profile(
  profile_name TEXT,
  manager_id UUID,
  profile_birth_date DATE DEFAULT NULL,
  profile_relationship TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_profile_id UUID;
BEGIN
  -- Generate a new UUID for the managed profile
  new_profile_id := gen_random_uuid();
  
  -- Insert the managed profile
  INSERT INTO public.profiles (id, full_name, birth_date, is_managed, managed_by)
  VALUES (new_profile_id, profile_name, profile_birth_date, true, manager_id);
  
  -- Create the caregiver relationship
  INSERT INTO public.caregiver_relationships (caregiver_id, patient_id, relationship, status)
  VALUES (manager_id, new_profile_id, COALESCE(profile_relationship, 'Dependente'), 'accepted')
  ON CONFLICT (patient_id, caregiver_id) 
  DO UPDATE SET relationship = EXCLUDED.relationship;
  
  RETURN new_profile_id;
END;
$$;
