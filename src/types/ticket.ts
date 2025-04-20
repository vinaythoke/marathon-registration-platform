import { Json } from "@/database.types";

export enum TicketStatus {
  ACTIVE = "active",
  SOLD_OUT = "sold_out",
  DRAFT = "draft",
  ARCHIVED = "archived"
}

export enum TicketType {
  REGULAR = "regular",
  EARLY_BIRD = "early_bird",
  VIP = "vip",
  GROUP = "group",
  STUDENT = "student"
}

export interface PricingRule {
  start_date?: string | Date;
  end_date?: string | Date;
  price: number;
  quantity?: number;
  min_purchase?: number;
  max_purchase?: number;
}

export interface TicketTypeSchema {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  type: TicketType;
  base_price: number;
  pricing_rules?: PricingRule[];
  quantity_total: number;
  quantity_sold: number;
  quantity_reserved: number;
  status: TicketStatus;
  visibility_rules?: {
    start_date?: string;
    end_date?: string;
    access_codes?: string[];
    restricted_to?: string[]; // User groups/roles that can purchase
  };
  features?: string[]; // Special features or perks included
  metadata?: Json;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  ticket_type_id: string;
  registration_id: string;
  order_id: string;
  price_paid: number;
  status: "valid" | "used" | "cancelled" | "refunded";
  check_in_time?: string;
  transfer_history?: {
    from_user_id: string;
    to_user_id: string;
    timestamp: string;
    notes?: string;
  }[];
  metadata?: Json;
  created_at: string;
  updated_at: string;
}

export interface TicketOrder {
  id: string;
  user_id: string;
  event_id: string;
  total_amount: number;
  status: "pending" | "completed" | "failed" | "refunded";
  payment_id?: string;
  payment_method?: string;
  tickets: Ticket[];
  metadata?: Json;
  created_at: string;
  updated_at: string;
}

export interface TicketTypeWithEvent extends TicketTypeSchema {
  event: {
    id: string;
    title: string;
    date: string;
    organizer_id: string;
  };
}

export interface TicketWithDetails extends Ticket {
  ticket_type: TicketTypeSchema;
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
  order: {
    id: string;
    status: TicketOrder["status"];
    payment_id?: string;
  };
} 