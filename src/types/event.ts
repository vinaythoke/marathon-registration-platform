import { Database } from '@/lib/database.types'
import { z } from 'zod'

export const EVENT_TYPE_OPTIONS = [
  { value: 'marathon', label: 'Marathon (42.2km)' },
  { value: 'half-marathon', label: 'Half Marathon (21.1km)' },
  { value: '10k', label: '10K Run' },
  { value: '5k', label: '5K Run' },
  { value: 'ultra', label: 'Ultra Marathon' },
  { value: 'trail', label: 'Trail Run' },
] as const

export const EVENT_CATEGORY_OPTIONS = [
  { value: 'road', label: 'Road Race' },
  { value: 'trail', label: 'Trail Race' },
  { value: 'charity', label: 'Charity Run' },
  { value: 'night', label: 'Night Run' },
  { value: 'obstacle', label: 'Obstacle Run' },
  { value: 'virtual', label: 'Virtual Run' },
] as const

export type EventType = typeof EVENT_TYPE_OPTIONS[number]['value']
export type EventCategory = typeof EVENT_CATEGORY_OPTIONS[number]['value']
export type EventStatus = 'draft' | 'published' | 'cancelled'

export type Event = Database['public']['Tables']['events']['Row']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventUpdate = Database['public']['Tables']['events']['Update']

const ticketTypeSchema = z.object({
  name: z.string().min(1, 'Ticket name is required'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  description: z.string().optional(),
  visibility: z.enum(['public', 'hidden']),
})

const discountCodeSchema = z.object({
  code: z.string().min(1, 'Discount code is required'),
  type: z.enum(['percentage', 'fixed']),
  amount: z.number()
    .min(0, 'Amount must be 0 or greater')
    .refine(
      (val) => val <= 100,
      (val) => ({
        message: val > 100 ? 'Percentage discount cannot exceed 100%' : 'Amount must be valid'
      })
    ),
})

export const eventFormSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
  date: z.string()
    .refine((date) => new Date(date) > new Date(), {
      message: 'Event date must be in the future',
    }),
  registration_deadline: z.string()
    .refine((date) => new Date(date) > new Date(), {
      message: 'Registration deadline must be in the future',
    }),
  location: z.string()
    .min(3, 'Location must be at least 3 characters')
    .max(200, 'Location cannot exceed 200 characters'),
  type: z.enum(['marathon', 'half-marathon', '10k', '5k', 'ultra', 'trail'] as const),
  categories: z.array(z.string())
    .min(1, 'Select at least one category')
    .max(3, 'Cannot select more than 3 categories'),
  capacity: z.number()
    .min(1, 'Capacity must be at least 1')
    .max(50000, 'Capacity cannot exceed 50,000'),
  banner_url: z.string().url('Invalid banner URL').optional(),
  banner_storage_path: z.string().optional(),
  banner_file: z.any().optional(),
  status: z.enum(['draft', 'published', 'cancelled'] as const),
  ticket_types: z.array(ticketTypeSchema)
    .min(1, 'At least one ticket type is required')
    .max(5, 'Cannot have more than 5 ticket types')
    .refine(
      (tickets) => {
        const totalQuantity = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0)
        return totalQuantity <= 50000
      },
      'Total ticket quantity cannot exceed 50,000'
    ),
  discount_codes: z.array(discountCodeSchema)
    .max(10, 'Cannot have more than 10 discount codes')
    .optional(),
})

export type EventFormData = z.infer<typeof eventFormSchema>

export interface EventFormProps {
  initialData?: Partial<EventFormData>
  onSubmit: (data: EventFormData) => Promise<void>
  isLoading?: boolean
} 