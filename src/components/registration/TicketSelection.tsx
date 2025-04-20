"use client";

import { useState } from 'react';
import { useRegistration } from './RegistrationContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, Minus, Plus, Lock, Info } from 'lucide-react';
import { calculateTotalPrice, formatCurrency, getPricingRuleDescription } from '@/lib/utils/pricing';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createRegistration } from '@/lib/actions/registration';
import { TicketWithAvailability } from '@/types/registration';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TicketTypeSchema } from '@/types/ticket';
import { cn } from '@/lib/utils';
import { requiresAccessCode, validateAccessCode, getAccessCodeMessage, isTicketVisible } from '@/lib/utils/access-codes';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TicketSelectionProps {
  tickets: TicketTypeSchema[];
  onSelect: (ticketId: string, quantity: number) => void;
  className?: string;
}

export function TicketSelection({ tickets, onSelect, className }: TicketSelectionProps) {
  const [accessCodes, setAccessCodes] = useState<Record<string, string>>({});
  const [accessCodeErrors, setAccessCodeErrors] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { profile } = useAuth();
  const { setSelectedQuantity } = useRegistration();

  const checkRoleAccess = (ticket: TicketTypeSchema): boolean => {
    if (!ticket.visibility_rules?.restricted_to?.length) {
      return true; // No role restrictions
    }
    return ticket.visibility_rules.restricted_to.includes(profile?.role || '');
  };

  const handleAccessCodeChange = (ticketId: string, code: string) => {
    setAccessCodes(prev => ({ ...prev, [ticketId]: code }));
    // Clear error when user starts typing
    if (accessCodeErrors[ticketId]) {
      setAccessCodeErrors(prev => ({ ...prev, [ticketId]: '' }));
    }
  };

  const getQuantityLimits = (ticket: TicketTypeSchema): { min: number; max: number } => {
    const availableQuantity = ticket.quantity_total - ticket.quantity_sold - ticket.quantity_reserved;
    let min = 1;
    let max = availableQuantity;

    // Check pricing rules for min/max purchase limits
    if (ticket.pricing_rules) {
      const now = new Date();
      const applicableRules = ticket.pricing_rules.filter(rule => {
        const isWithinDateRange = (!rule.start_date || new Date(rule.start_date) <= now) &&
                                (!rule.end_date || new Date(rule.end_date) >= now);
        return isWithinDateRange;
      });

      if (applicableRules.length > 0) {
        // Use the most restrictive limits from applicable rules
        const ruleLimits = applicableRules.reduce((limits, rule) => ({
          min: Math.max(limits.min, rule.min_purchase || 1),
          max: rule.max_purchase ? Math.min(limits.max, rule.max_purchase) : limits.max
        }), { min: 1, max: availableQuantity });

        min = ruleLimits.min;
        max = ruleLimits.max;
      }
    }

    return { min, max };
  };

  const handleQuantityChange = (ticketId: string, delta: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const { min, max } = getQuantityLimits(ticket);
    const currentQuantity = quantities[ticketId] || min;
    const newQuantity = Math.max(min, Math.min(max, currentQuantity + delta));

    setQuantities(prev => ({ ...prev, [ticketId]: newQuantity }));
    setSelectedQuantity(newQuantity);
  };

  const handleTicketSelect = (ticket: TicketTypeSchema) => {
    if (requiresAccessCode(ticket)) {
      const code = accessCodes[ticket.id] || '';
      if (!validateAccessCode(ticket, code)) {
        setAccessCodeErrors(prev => ({
          ...prev,
          [ticket.id]: 'Invalid access code. Please try again.'
        }));
        return;
      }
    }
    const currentQuantity = quantities[ticket.id] || getQuantityLimits(ticket).min;
    setSelectedQuantity(currentQuantity);
    onSelect(ticket.id, currentQuantity);
  };
  
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-col gap-4">
        {tickets.map((ticket) => {
          const { min, max } = getQuantityLimits(ticket);
          const currentQuantity = quantities[ticket.id] || min;
          const hasRoleAccess = checkRoleAccess(ticket);
          const isVisible = isTicketVisible(ticket) && hasRoleAccess;
          
          // Don't render tickets that the user doesn't have role access to
          if (!hasRoleAccess) {
            return null;
          }
                
                return (
            <div key={ticket.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{ticket.name}</h3>
                    {ticket.visibility_rules?.restricted_to?.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="text-xs cursor-help">
                              <Lock className="h-3 w-3 mr-1" />
                              {ticket.visibility_rules.restricted_to.join(', ')}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This ticket is restricted to {ticket.visibility_rules.restricted_to.join(' or ')} only.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <p className="text-gray-600">{ticket.description}</p>
                  {requiresAccessCode(ticket) && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <Info className="h-3 w-3" />
                      <span>This ticket requires an access code</span>
                    </div>
                  )}
                  <div className="mt-2">
                    {(() => {
                      const { pricePerTicket, totalPrice, appliedRule } = calculateTotalPrice(ticket, currentQuantity);
                      return (
                        <>
                          <p className="text-lg font-bold">
                            {formatCurrency(pricePerTicket)}
                            {appliedRule && pricePerTicket < ticket.base_price && (
                              <span className="ml-2 text-sm line-through text-gray-500">
                                {formatCurrency(ticket.base_price)}
                              </span>
                            )}
                            {currentQuantity > 1 && (
                              <span className="ml-2 text-sm text-gray-600">
                                × {currentQuantity} = {formatCurrency(totalPrice)}
                              </span>
                            )}
                          </p>
                          {appliedRule && (
                            <p className="text-sm text-green-600 mt-1">
                              {getPricingRuleDescription(appliedRule)}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            {ticket.quantity_total - ticket.quantity_sold - ticket.quantity_reserved} tickets remaining
                          </p>
                        </>
                      );
                    })()}
                        </div>
                      </div>
                <div className="flex flex-col gap-2">
                  {requiresAccessCode(ticket) && (
                    <>
                      <Input
                        type="text"
                        placeholder="Enter access code"
                        value={accessCodes[ticket.id] || ''}
                        onChange={(e) => handleAccessCodeChange(ticket.id, e.target.value)}
                        className="w-40"
                      />
                      {accessCodeErrors[ticket.id] && (
                        <p className="text-sm text-red-500">{accessCodeErrors[ticket.id]}</p>
                      )}
                    </>
                  )}
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(ticket.id, -1)}
                      disabled={currentQuantity <= min}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{currentQuantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(ticket.id, 1)}
                      disabled={currentQuantity >= max}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                    </div>
              <Button
                onClick={() => handleTicketSelect(ticket)}
                disabled={!isVisible || (requiresAccessCode(ticket) && !validateAccessCode(ticket, accessCodes[ticket.id] || ''))}
                className="w-full"
              >
                Select {currentQuantity > 1 ? `${currentQuantity} Tickets` : 'Ticket'}
              </Button>
                  </div>
                );
              })}
      </div>
    </div>
  );
} 