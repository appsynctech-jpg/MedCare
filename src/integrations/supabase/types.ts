export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          created_at: string | null
          doctor_id: string | null
          id: string
          notes: string | null
          preparations: string | null
          status: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_date: string
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          preparations?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_date?: string
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          preparations?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_relationships: {
        Row: {
          caregiver_id: string
          created_at: string | null
          id: string
          patient_id: string
          permissions: Json
          status: string
          updated_at: string | null
        }
        Insert: {
          caregiver_id: string
          created_at?: string | null
          id?: string
          patient_id: string
          permissions?: Json
          status?: string
          updated_at?: string | null
        }
        Update: {
          caregiver_id?: string
          created_at?: string | null
          id?: string
          patient_id?: string
          permissions?: Json
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_relationships_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caregiver_relationships_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          address: string | null
          created_at: string | null
          crm: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          specialty: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          crm?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          specialty: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          crm?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          specialty?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string
          priority: number
          relationship: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone: string
          priority?: number
          relationship: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string
          priority?: number
          relationship?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_documents: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          description: string | null
          doctor_id: string | null
          document_date: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          description?: string | null
          doctor_id?: string | null
          document_date?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          description?: string | null
          doctor_id?: string | null
          document_date?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_documents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_documents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_logs: {
        Row: {
          created_at: string | null
          id: string
          medication_id: string
          schedule_id: string
          scheduled_time: string
          status: string
          taken_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          medication_id: string
          schedule_id: string
          scheduled_time: string
          status: string
          taken_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          medication_id?: string
          schedule_id?: string
          scheduled_time?: string
          status?: string
          taken_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "medication_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_notifications: {
        Row: {
          alert_type: string
          contact_id: string | null
          id: string
          medication_id: string | null
          metadata: Json | null
          schedule_id: string | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          contact_id?: string | null
          id?: string
          medication_id?: string | null
          metadata?: Json | null
          schedule_id?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          contact_id?: string | null
          id?: string
          medication_id?: string | null
          metadata?: Json | null
          schedule_id?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_notifications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "emergency_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_notifications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_notifications_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "medication_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_schedules: {
        Row: {
          created_at: string | null
          id: string
          medication_id: string
          time: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          medication_id: string
          time: string
        }
        Update: {
          created_at?: string | null
          id?: string
          medication_id?: string
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_schedules_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_snoozes: {
        Row: {
          created_at: string | null
          id: string
          medication_id: string
          schedule_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          medication_id: string
          schedule_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          medication_id?: string
          schedule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_snoozes_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_snoozes_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "medication_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_snoozes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean | null
          created_at: string | null
          daily_frequency: number
          dosage: string
          end_date: string | null
          form: string | null
          id: string
          instructions: string | null
          manufacturer: string | null
          name: string
          photo_url: string | null
          start_date: string
          stock_quantity: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          daily_frequency: number
          dosage: string
          end_date?: string | null
          form?: string | null
          id?: string
          instructions?: string | null
          manufacturer?: string | null
          name: string
          photo_url?: string | null
          start_date: string
          stock_quantity?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          daily_frequency?: number
          dosage?: string
          end_date?: string | null
          form?: string | null
          id?: string
          instructions?: string | null
          manufacturer?: string | null
          name?: string
          photo_url?: string | null
          start_date?: string
          stock_quantity?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      panic_logs: {
        Row: {
          contacts_notified: Json | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          message: string
          user_id: string
        }
        Insert: {
          contacts_notified?: Json | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          message: string
          user_id: string
        }
        Update: {
          contacts_notified?: Json | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "panic_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string | null
          email: string | null
          emergency_info: Json | null
          font_size: string | null
          full_name: string
          id: string
          onboarding_completed: boolean | null
          phone: string | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          emergency_info?: Json | null
          font_size?: string | null
          full_name: string
          id: string
          onboarding_completed?: boolean | null
          phone?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          emergency_info?: Json | null
          font_size?: string | null
          full_name?: string
          id?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          platform: string | null
          push_token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform?: string | null
          push_token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string | null
          push_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_access: {
        Row: {
          access_level: string
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          permissions: Json
          revoked: boolean | null
          shared_with_email: string
          user_id: string
        }
        Insert: {
          access_level: string
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          permissions?: Json
          revoked?: boolean | null
          shared_with_email: string
          user_id: string
        }
        Update: {
          access_level?: string
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          permissions?: Json
          revoked?: boolean | null
          shared_with_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
