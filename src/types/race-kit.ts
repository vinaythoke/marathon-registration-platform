export type RaceKitSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type RaceKitType = 'standard' | 'premium' | 'elite';
export type RaceKitStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type PickupStatus = 'pending' | 'picked_up' | 'cancelled';

export interface RaceKitInventory {
  kit_id: string;
  event_id: string;
  size: RaceKitSize;
  quantity: number;
  type: RaceKitType;
  status: RaceKitStatus;
  created_at: string;
  updated_at: string;
}

export interface KitAssignment {
  assignment_id: string;
  kit_id: string;
  registration_id: string;
  pickup_status: PickupStatus;
  assigned_at: string;
  picked_up_at: string | null;
  notes: string | null;
}

export interface RaceKitWithEvent extends RaceKitInventory {
  event: {
    id: string;
    title: string;
    date: string;
  };
}

export interface KitAssignmentWithDetails extends KitAssignment {
  kit: RaceKitInventory;
  registration: {
    id: string;
    user_id: string;
    event_id: string;
    user: {
      id: string;
      full_name: string;
      email: string;
    };
  };
} 