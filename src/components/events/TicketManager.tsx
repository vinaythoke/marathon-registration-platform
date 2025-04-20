'use client';

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Calendar, DollarSign, Tag, Check, X } from 'lucide-react'
import { format, isAfter, isBefore } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// Define the pricing rule schema
const pricingRuleSchema = z.object({
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  quantity: z.coerce.number().min(0, 'Quantity must be 0 or greater').optional(),
  min_purchase: z.coerce.number().min(1, 'Minimum purchase must be at least 1').optional(),
  max_purchase: z.coerce.number().min(1, 'Maximum purchase must be at least 1')
    .optional()
    .refine(
      (val) => !val || val >= (pricingRuleSchema.shape.min_purchase.optional().parse(undefined) || 1),
      'Maximum purchase must be greater than or equal to minimum purchase'
    ),
});

// Update the ticket form schema
const ticketFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['regular', 'early_bird', 'vip', 'group', 'student']).default('regular'),
  base_price: z.coerce.number().min(0, 'Base price must be 0 or greater'),
  pricing_rules: z.array(pricingRuleSchema).optional(),
  quantity_total: z.coerce.number().min(1, 'Quantity must be at least 1'),
  quantity_sold: z.coerce.number().min(0, 'Quantity sold must be 0 or greater').default(0),
  quantity_reserved: z.coerce.number().min(0, 'Reserved quantity must be 0 or greater').default(0),
  status: z.enum(['active', 'sold_out', 'disabled']),
  features: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
}).refine((data) => {
  if (data.pricing_rules?.length) {
    // Ensure pricing rules don't overlap in dates
    const sortedRules = [...data.pricing_rules].sort((a, b) => 
      (a.start_date?.getTime() || 0) - (b.start_date?.getTime() || 0)
    );
    
    for (let i = 0; i < sortedRules.length - 1; i++) {
      const currentRule = sortedRules[i];
      const nextRule = sortedRules[i + 1];
      
      if (currentRule.end_date && nextRule.start_date && 
          currentRule.end_date > nextRule.start_date) {
        return false;
      }
    }
  }
  return true;
}, {
  message: "Pricing rule dates cannot overlap",
  path: ["pricing_rules"],
});

// Interface for the component props
interface TicketManagerProps {
  eventId: string;
  eventCapacity: number;
  initialTickets: any[];
}

// Interface for a ticket
interface Ticket {
  id?: string;
  event_id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  max_per_user: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'sold_out' | 'disabled';
}

export function TicketManager({ eventId, eventCapacity, initialTickets }: TicketManagerProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  // Form for adding/editing tickets
  const form = useForm<z.infer<typeof ticketFormSchema>>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'regular',
      base_price: 0,
      quantity_total: 0,
      status: 'active' as const,
    },
  });

  // Calculate total ticket capacity
  const totalCapacity = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  const hasCapacityError = totalCapacity > eventCapacity;

  // Handle ticket form submission (add/edit)
  const onSubmit = async (values: z.infer<typeof ticketFormSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Convert dates to ISO strings for storage
      const ticketData = {
        ...values,
        event_id: eventId,
        start_date: values.start_date?.toISOString() || '',
        end_date: values.end_date?.toISOString() || '',
      };
      
      if (currentTicket?.id) {
        // Update existing ticket
        const { error } = await supabase
          .from('tickets')
          .update(ticketData)
          .eq('id', currentTicket.id);
          
        if (error) throw error;
        
        toast({
          title: "Ticket updated",
          description: "Your ticket has been updated successfully.",
        });
        
        // Update local state
        setTickets(prev => prev.map(t => t.id === currentTicket.id ? {...ticketData, id: currentTicket.id} : t));
      } else {
        // Create new ticket
        const { data, error } = await supabase
          .from('tickets')
          .insert([ticketData])
          .select();
          
        if (error) throw error;
        
        toast({
          title: "Ticket created",
          description: "Your ticket has been created successfully.",
        });
        
        // Update local state
        if (data?.[0]) {
          setTickets(prev => [...prev, data[0]]);
        }
      }
      
      // Reset and close dialog
      form.reset();
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast({
        variant: "destructive",
        title: "Failed to save ticket",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle ticket deletion
  const handleDeleteTicket = async () => {
    if (!currentTicket?.id) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', currentTicket.id);
        
      if (error) throw error;
      
      toast({
        title: "Ticket deleted",
        description: "Your ticket has been deleted successfully.",
      });
      
      // Update local state
      setTickets(prev => prev.filter(t => t.id !== currentTicket.id));
      setIsDeleteDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete ticket",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize edit form
  const handleEditTicket = (ticket: Ticket) => {
    setCurrentTicket(ticket);
    form.reset({
      name: ticket.name,
      description: ticket.description || '',
      type: 'regular',
      base_price: ticket.price,
      quantity_total: ticket.quantity,
      status: ticket.status,
    });
    setIsEditDialogOpen(true);
  };

  // Handle new ticket creation
  const handleAddTicket = () => {
    setCurrentTicket(null);
    form.reset({
      name: '',
      description: '',
      type: 'regular',
      base_price: 0,
      quantity_total: 50,
      status: 'active',
    });
    setIsAddDialogOpen(true);
  };

  // Get ticket status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'sold_out':
        return <Badge variant="destructive">Sold Out</Badge>;
      case 'disabled':
        return <Badge variant="outline">Disabled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Determine if a ticket is currently available for sale
  const isTicketActive = (ticket: Ticket) => {
    const now = new Date();
    const startDate = new Date(ticket.start_date);
    const endDate = new Date(ticket.end_date);
    
    return ticket.status === 'active' && 
           isAfter(now, startDate) && 
           isBefore(now, endDate);
  };

  return (
    <div className="space-y-6">
      {/* Capacity warning */}
      {hasCapacityError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Warning:</strong> Total ticket quantity ({totalCapacity}) exceeds event capacity ({eventCapacity}).
                Either increase event capacity or reduce ticket quantities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current tickets display */}
      <div className="grid grid-cols-1 gap-4">
        {tickets.length === 0 ? (
          <div className="text-center p-8 border rounded-lg">
            <p className="text-muted-foreground">No tickets created yet. Create your first ticket to allow registrations.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} className={cn(
              "transition-all duration-200",
              isTicketActive(ticket) ? "border-green-200 shadow-sm" : ""
            )}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{ticket.name}</CardTitle>
                  <div className="flex gap-2 mt-1">
                    {getStatusBadge(ticket.status)}
                    {isTicketActive(ticket) && (
                      <Badge variant="outline" className="bg-green-50">On Sale Now</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">
                    {ticket.price === 0 ? 'Free' : `₹${ticket.price.toFixed(2)}`}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {ticket.description && (
                  <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="flex items-center text-sm">
                    <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Remaining: {ticket.quantity}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Sales: {format(new Date(ticket.start_date), 'MMM d')} - {format(new Date(ticket.end_date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Max per person: {ticket.max_per_user}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-end gap-2">
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setCurrentTicket(ticket);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleEditTicket(ticket)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Add ticket button */}
      <Button onClick={handleAddTicket} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Ticket Type
      </Button>

      {/* Add Ticket Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Ticket</DialogTitle>
            <DialogDescription>
              Create a new ticket type for this event.
            </DialogDescription>
          </DialogHeader>
          <TicketForm form={form} onSubmit={onSubmit} isSubmitting={isSubmitting} />
        </DialogContent>
      </Dialog>

      {/* Edit Ticket Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>
              Update the details for this ticket type.
            </DialogDescription>
          </DialogHeader>
          <TicketForm form={form} onSubmit={onSubmit} isSubmitting={isSubmitting} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTicket}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extracted ticket form component
function TicketForm({ form, onSubmit, isSubmitting }: {
  form: any;
  onSubmit: (values: any) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [showPricingRules, setShowPricingRules] = useState(false);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ticket Name</FormLabel>
              <FormControl>
                <Input placeholder="General Admission" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Standard entry ticket with all benefits" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ticket Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="early_bird">Early Bird</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="base_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Price (₹)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormDescription>Base ticket price before any rules</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Dynamic Pricing Rules</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPricingRules(!showPricingRules)}
            >
              {showPricingRules ? 'Hide Rules' : 'Show Rules'}
            </Button>
          </div>

          {showPricingRules && (
            <div className="space-y-4">
              {form.watch('pricing_rules')?.map((rule: any, index: number) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Rule {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const rules = form.getValues('pricing_rules');
                          rules.splice(index, 1);
                          form.setValue('pricing_rules', rules);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`pricing_rules.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`pricing_rules.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity Limit (Optional)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`pricing_rules.${index}.start_date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date (Optional)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`pricing_rules.${index}.end_date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date (Optional)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`pricing_rules.${index}.min_purchase`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Purchase (Optional)</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`pricing_rules.${index}.max_purchase`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Purchase (Optional)</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentRules = form.getValues('pricing_rules') || [];
                  form.setValue('pricing_rules', [
                    ...currentRules,
                    {
                      price: form.getValues('base_price'),
                      quantity: null,
                      start_date: null,
                      end_date: null,
                      min_purchase: null,
                      max_purchase: null,
                    }
                  ]);
                }}
              >
                Add Pricing Rule
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity_total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity Available</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="sold_out">Sold Out</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Ticket'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
} 