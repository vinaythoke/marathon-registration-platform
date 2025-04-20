"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import * as z from 'zod'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { EventFormData, EventFormProps, eventFormSchema, EVENT_TYPE_OPTIONS } from '@/types/event'

const eventTypes = [
  { value: "5k", label: "5K Run" },
  { value: "10k", label: "10K Run" },
  { value: "half-marathon", label: "Half Marathon" },
  { value: "marathon", label: "Full Marathon" },
  { value: "ultra-marathon", label: "Ultra Marathon" },
] as const

const formSchema = z.object({
  title: z.string().min(1, "Event title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Event description is required").max(1000, "Description must be less than 1000 characters"),
  date: z.string().min(1, "Event date is required"),
  registrationDeadline: z.string().min(1, "Registration deadline is required"),
  location: z.string().min(1, "Event location is required"),
  eventType: z.enum(["5k", "10k", "half-marathon", "marathon", "ultra-marathon"] as const, {
    required_error: "Please select an event type",
  }),
  capacity: z.number()
    .min(1, "Capacity must be at least 1")
    .max(10000, "Capacity cannot exceed 10,000 participants"),
}).refine((data) => {
  const eventDate = new Date(data.date);
  const regDeadline = new Date(data.registrationDeadline);
  return regDeadline < eventDate;
}, {
  message: "Registration deadline must be before the event date",
  path: ["registrationDeadline"],
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

/**
 * A simplified event form component for testing and development
 */
export function EventForm({ initialData, onSubmit, isLoading = false }: Props) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      date: initialData?.date || '',
      registrationDeadline: initialData?.registrationDeadline || '',
      location: initialData?.location || '',
      eventType: initialData?.eventType || '5k',
      capacity: initialData?.capacity || 100,
    },
  })

  const handleSubmit = async (data: FormData) => {
    try {
      await onSubmit(data)
      toast({
        title: "Success",
        description: "Event created successfully!",
      })
      // Only reset if not editing an existing event
      if (!initialData) {
        form.reset()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create event. Please try again.",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter event title"
                  {...field}
                  aria-label="Event title input"
                />
              </FormControl>
              <FormDescription>
                Choose a clear and descriptive title for your event.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter event description"
                  {...field}
                  aria-label="Event description input"
                />
              </FormControl>
              <FormDescription>
                Provide detailed information about your event.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Date</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    aria-label="Event date input"
                  />
                </FormControl>
                <FormDescription>
                  When will the event take place?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="registrationDeadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Deadline</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    aria-label="Registration deadline input"
                  />
                </FormControl>
                <FormDescription>
                  Last date for participants to register.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter event location"
                  {...field}
                  aria-label="Event location input"
                />
              </FormControl>
              <FormDescription>
                Where will the event take place?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger aria-label="Select event type">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {eventTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the type of running event you are organizing.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Capacity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter maximum number of participants"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  value={field.value}
                  min={1}
                  max={10000}
                  aria-label="Event capacity input"
                />
              </FormControl>
              <FormDescription>
                The maximum number of participants allowed to register (1-10,000).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isLoading}
            aria-label="Create event button"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Event...
              </>
            ) : (
              'Create Event'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 