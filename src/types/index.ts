export interface Profile {
  id: string;
  full_name: string;
  birth_date: string | null;
  phone: string | null;
  emergency_info: {
    allergies: string[];
    blood_type: string | null;
    chronic_conditions: string[];
  };
  theme: 'light' | 'dark' | 'high-contrast';
  font_size: 'sm' | 'md' | 'lg' | 'xl';
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  form: string | null;
  manufacturer: string | null;
  photo_url: string | null;
  stock_quantity: number;
  daily_frequency: number;
  start_date: string;
  end_date: string | null;
  instructions: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  dose_amount: string | null;
  medication_schedules?: MedicationSchedule[];
}

export interface MedicationSchedule {
  id: string;
  medication_id: string;
  time: string;
  created_at: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  schedule_id: string;
  scheduled_time: string;
  taken_at: string | null;
  status: 'confirmed' | 'missed' | 'skipped';
  created_at: string;
  medications?: { name: string };
}

export interface Doctor {
  id: string;
  user_id: string;
  name: string;
  specialty: string;
  crm: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  doctor_id: string | null;
  appointment_date: string;
  type: 'consultation' | 'exam' | 'return';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  preparations: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  doctors?: Doctor;
}

export interface MedicalDocument {
  id: string;
  user_id: string;
  appointment_id: string | null;
  doctor_id: string | null;
  type: 'exam' | 'prescription' | 'report' | 'vaccine' | 'certificate';
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size: number | null;
  document_date: string | null;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  priority: number;
  created_at: string;
}

export interface PanicLog {
  id: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  message: string;
  contacts_notified: any[];
  created_at: string;
}

export interface SharedAccess {
  id: string;
  user_id: string;
  shared_with_email: string;
  access_token: string;
  permissions: {
    medications: boolean;
    appointments: boolean;
    documents: boolean;
  };
  access_level: 'read' | 'write';
  expires_at: string;
  revoked: boolean;
  created_at: string;
}
export interface CaregiverRelationship {
  id: string;
  patient_id: string;
  caregiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  permissions: {
    medications: boolean;
    appointments: boolean;
    panic: boolean;
  };
  created_at: string;
  updated_at: string;
  profiles?: Profile; // Patient or caregiver profile
}

export interface PushSubscription {
  id: string;
  user_id: string;
  push_token: string;
  platform: string;
  created_at: string;
}
