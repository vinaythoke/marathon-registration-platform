import { PaymentStatus } from '@/types/payment';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'runner' | 'organizer' | 'volunteer';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          title: string;
          date: string;
          status: 'draft' | 'published' | 'cancelled';
          organizer_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      registrations: {
        Row: {
          id: string;
          user_id: string | null;
          event_id: string | null;
          ticket_id: string | null;
          payment_status: string;
          payment_id: string | null;
          amount_paid: number;
          status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_id?: string | null;
          ticket_id?: string | null;
          payment_status?: string;
          payment_id?: string | null;
          amount_paid: number;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_id?: string | null;
          ticket_id?: string | null;
          payment_status?: string;
          payment_id?: string | null;
          amount_paid?: number;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registrations_ticket_id_fkey";
            columns: ["ticket_id"];
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registrations_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      tickets: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          description: string;
          price: number;
          quantity: number;
          max_per_user: number;
          status: 'active' | 'inactive';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tickets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tickets']['Insert']>;
      };
      runner_profiles: {
        Row: {
          id: string;
          address: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string | null;
          phone: string | null;
          date_of_birth: string | null;
          gender: 'male' | 'female' | 'non-binary' | 'prefer_not_to_say' | null;
          
          medical_conditions: string | null;
          allergies: string | null;
          medications: string | null;
          blood_type: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown' | null;
          
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relationship: string | null;
          
          experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null;
          years_running: number | null;
          previous_marathons: number | null;
          average_pace: string | null;
          
          preferred_distance: string[] | null;
          running_goals: string | null;
          t_shirt_size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | null;
          
          profile_image_url: string | null;
          bio: string | null;
          
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['runner_profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['runner_profiles']['Insert']>;
      };
      run_statistics: {
        Row: {
          id: string;
          user_id: string;
          event_id: string | null;
          registration_id: string | null;
          event_date: string;
          distance: number;
          time_seconds: number;
          pace_per_km: number;
          elevation_gain: number;
          average_heart_rate: number | null;
          notes: string | null;
          achievements: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id?: string | null;
          registration_id?: string | null;
          event_date: string;
          distance: number;
          time_seconds: number;
          pace_per_km: number;
          elevation_gain?: number;
          average_heart_rate?: number | null;
          notes?: string | null;
          achievements?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string | null;
          registration_id?: string | null;
          event_date?: string;
          distance?: number;
          time_seconds?: number;
          pace_per_km?: number;
          elevation_gain?: number;
          average_heart_rate?: number | null;
          notes?: string | null;
          achievements?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "run_statistics_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "run_statistics_registration_id_fkey";
            columns: ["registration_id"];
            referencedRelation: "registrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "run_statistics_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      volunteer_roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          event_id: string;
          required_volunteers: number;
          location: string | null;
          start_time: string | null;
          end_time: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          event_id: string;
          required_volunteers?: number;
          location?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          event_id?: string;
          required_volunteers?: number;
          location?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "volunteer_roles_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      volunteer_profiles: {
        Row: {
          id: string;
          address: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string | null;
          phone: string | null;
          date_of_birth: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relationship: string | null;
          skills: string[] | null;
          availability: Json | null;
          t_shirt_size: string | null;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          skills?: string[] | null;
          availability?: Json | null;
          t_shirt_size?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          skills?: string[] | null;
          availability?: Json | null;
          t_shirt_size?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "volunteer_profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      volunteer_assignments: {
        Row: {
          id: string;
          volunteer_id: string;
          role_id: string;
          event_id: string;
          status: string;
          check_in_time: string | null;
          check_out_time: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          volunteer_id: string;
          role_id: string;
          event_id: string;
          status?: string;
          check_in_time?: string | null;
          check_out_time?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          volunteer_id?: string;
          role_id?: string;
          event_id?: string;
          status?: string;
          check_in_time?: string | null;
          check_out_time?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "volunteer_assignments_volunteer_id_fkey";
            columns: ["volunteer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "volunteer_assignments_role_id_fkey";
            columns: ["role_id"];
            referencedRelation: "volunteer_roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "volunteer_assignments_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      volunteer_training: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          content_url: string | null;
          is_required: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          content_url?: string | null;
          is_required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          content_url?: string | null;
          is_required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      volunteer_role_training: {
        Row: {
          role_id: string;
          training_id: string;
        };
        Insert: {
          role_id: string;
          training_id: string;
        };
        Update: {
          role_id?: string;
          training_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "volunteer_role_training_role_id_fkey";
            columns: ["role_id"];
            referencedRelation: "volunteer_roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "volunteer_role_training_training_id_fkey";
            columns: ["training_id"];
            referencedRelation: "volunteer_training";
            referencedColumns: ["id"];
          }
        ];
      };
      volunteer_training_completion: {
        Row: {
          volunteer_id: string;
          training_id: string;
          completed_at: string;
        };
        Insert: {
          volunteer_id: string;
          training_id: string;
          completed_at?: string;
        };
        Update: {
          volunteer_id?: string;
          training_id?: string;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "volunteer_training_completion_volunteer_id_fkey";
            columns: ["volunteer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "volunteer_training_completion_training_id_fkey";
            columns: ["training_id"];
            referencedRelation: "volunteer_training";
            referencedColumns: ["id"];
          }
        ];
      };
      race_kits: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          description: string | null;
          total_quantity: number;
          distributed_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          description?: string | null;
          total_quantity?: number;
          distributed_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          description?: string | null;
          total_quantity?: number;
          distributed_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "race_kits_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      kit_distribution: {
        Row: {
          id: string;
          kit_id: string;
          registration_id: string;
          distributed_by: string | null;
          distributed_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          kit_id: string;
          registration_id: string;
          distributed_by?: string | null;
          distributed_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          kit_id?: string;
          registration_id?: string;
          distributed_by?: string | null;
          distributed_at?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "kit_distribution_kit_id_fkey";
            columns: ["kit_id"];
            referencedRelation: "race_kits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kit_distribution_registration_id_fkey";
            columns: ["registration_id"];
            referencedRelation: "registrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kit_distribution_distributed_by_fkey";
            columns: ["distributed_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          id: string;
          registration_id: string;
          order_id: string;
          amount: number;
          currency: string;
          status: PaymentStatus;
          payment_session_id?: string;
          order_token?: string;
          cf_order_id?: string;
          transaction_data?: Json;
          refund_data?: Json;
          payment_method_id?: string;
          billing_address?: Json;
          shipping_address?: Json;
          customer_notes?: string;
          admin_notes?: string;
          refund_reason?: string;
          refund_amount?: number;
          refund_status?: string;
          refund_transaction_id?: string;
          is_test: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
          {
            foreignKeyName: "payments_registration_id_fkey";
            columns: ["registration_id"];
            referencedRelation: "registrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey";
            columns: ["payment_method_id"];
            referencedRelation: "payment_methods";
            referencedColumns: ["id"];
          }
        ];
      };
      payment_methods: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description?: string;
          icon_url?: string;
          is_enabled: boolean;
          config?: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payment_methods']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['payment_methods']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      payment_transactions: {
        Row: {
          id: string;
          payment_id: string;
          transaction_type: string;
          amount: number;
          currency: string;
          status: string;
          gateway_transaction_id?: string;
          gateway_response?: Json;
          error_message?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payment_transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['payment_transactions']['Row'], 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: "payment_transactions_payment_id_fkey";
            columns: ["payment_id"];
            referencedRelation: "payments";
            referencedColumns: ["id"];
          }
        ];
      };
      payment_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: Json;
          description?: string;
          is_encrypted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payment_settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['payment_settings']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
} 