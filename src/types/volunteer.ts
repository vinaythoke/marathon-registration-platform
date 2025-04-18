import { Json } from "@/database.types";
import { Profile } from "./database";

// Volunteer profile type extending the base profile
export interface VolunteerProfile {
  id: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  skills?: string[];
  availability?: Json;
  t_shirt_size?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  
  // Join with profiles table
  profile?: Profile;
}

// Volunteer role type
export interface VolunteerRole {
  id: string;
  name: string;
  description?: string;
  event_id: string;
  required_volunteers: number;
  location?: string;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Calculated fields
  assigned_volunteers_count?: number;
  volunteers?: Array<VolunteerWithProfile>;
}

// Volunteer assignment type
export interface VolunteerAssignment {
  id: string;
  volunteer_id: string;
  role_id: string;
  event_id: string;
  status: 'assigned' | 'confirmed' | 'declined' | 'completed';
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Join fields
  volunteer?: VolunteerWithProfile;
  role?: VolunteerRole;
}

// Training material type
export interface VolunteerTraining {
  id: string;
  title: string;
  description?: string;
  content_url?: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
  
  // Calculated fields
  completion_percentage?: number;
}

// Training completion record
export interface TrainingCompletion {
  volunteer_id: string;
  training_id: string;
  completed_at: string;
  
  // Join fields
  volunteer?: VolunteerWithProfile;
  training?: VolunteerTraining;
}

// Race kit type
export interface RaceKit {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  total_quantity: number;
  distributed_quantity: number;
  created_at: string;
  updated_at: string;
  
  // Calculated fields
  available_quantity?: number;
}

// Kit distribution record
export interface KitDistribution {
  id: string;
  kit_id: string;
  registration_id: string;
  distributed_by?: string;
  distributed_at: string;
  notes?: string;
  
  // Join fields
  kit?: RaceKit;
  distributor?: Profile;
}

// Combined volunteer with profile
export interface VolunteerWithProfile extends VolunteerProfile {
  profile: Profile;
}

// Form types for volunteer management
export interface VolunteerRoleForm {
  name: string;
  description?: string;
  event_id: string;
  required_volunteers: number;
  location?: string;
  start_time?: string;
  end_time?: string;
}

export interface VolunteerProfileForm {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  skills?: string[];
  availability?: Json;
  t_shirt_size?: string;
  notes?: string;
}

// Response type for volunteer dashboard stats
export interface VolunteerDashboardStats {
  total_volunteers: number;
  total_roles: number;
  active_roles: number;
  filled_roles: number;
  checked_in_volunteers: number;
  total_training_completions: number;
  kits_distributed: number;
} 