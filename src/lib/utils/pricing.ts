import { PricingRule, TicketTypeSchema } from '@/types/ticket';

/**
 * Calculate the current price for a ticket type based on its pricing rules
 */
export function calculateTicketPrice(
  ticketType: TicketTypeSchema,
  quantity: number = 1,
  currentDate: Date = new Date()
): { price: number; appliedRule: PricingRule | null } {
  // If no pricing rules, return base price
  if (!ticketType.pricing_rules || ticketType.pricing_rules.length === 0) {
    return { price: ticketType.base_price, appliedRule: null };
  }

  // Convert dates in pricing rules from strings to Date objects
  const rulesWithDates = ticketType.pricing_rules.map(rule => ({
    ...rule,
    start_date: rule.start_date ? new Date(rule.start_date) : undefined,
    end_date: rule.end_date ? new Date(rule.end_date) : undefined
  }));

  // Find applicable rules (matching date range and quantity requirements)
  const applicableRules = rulesWithDates.filter(rule => {
    const isWithinDateRange = (!rule.start_date || currentDate >= rule.start_date) &&
                            (!rule.end_date || currentDate <= rule.end_date);
    
    const meetsQuantityRequirements = (!rule.min_purchase || quantity >= rule.min_purchase) &&
                                    (!rule.max_purchase || quantity <= rule.max_purchase);
    
    const hasAvailableQuantity = !rule.quantity || 
                                (ticketType.quantity_sold < rule.quantity);

    return isWithinDateRange && meetsQuantityRequirements && hasAvailableQuantity;
  });

  if (applicableRules.length === 0) {
    return { price: ticketType.base_price, appliedRule: null };
  }

  // Sort rules by price (lowest first) to get the best deal for the customer
  const sortedRules = applicableRules.sort((a, b) => a.price - b.price);
  const bestRule = sortedRules[0];

  return {
    price: bestRule.price,
    appliedRule: bestRule
  };
}

/**
 * Calculate the total price for multiple tickets
 */
export function calculateTotalPrice(
  ticketType: TicketTypeSchema,
  quantity: number,
  currentDate: Date = new Date()
): { totalPrice: number; pricePerTicket: number; appliedRule: PricingRule | null } {
  const { price, appliedRule } = calculateTicketPrice(ticketType, quantity, currentDate);
  
  return {
    totalPrice: price * quantity,
    pricePerTicket: price,
    appliedRule
  };
}

/**
 * Format a price as currency
 */
export function formatCurrency(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(price);
}

/**
 * Get a human-readable description of why a pricing rule was applied
 */
export function getPricingRuleDescription(rule: PricingRule): string {
  const parts: string[] = [];

  if (rule.start_date && rule.end_date) {
    parts.push(`Valid from ${new Date(rule.start_date).toLocaleDateString()} to ${new Date(rule.end_date).toLocaleDateString()}`);
  } else if (rule.start_date) {
    parts.push(`Valid from ${new Date(rule.start_date).toLocaleDateString()}`);
  } else if (rule.end_date) {
    parts.push(`Valid until ${new Date(rule.end_date).toLocaleDateString()}`);
  }

  if (rule.quantity) {
    parts.push(`Limited to first ${rule.quantity} tickets`);
  }

  if (rule.min_purchase && rule.max_purchase) {
    parts.push(`Must purchase ${rule.min_purchase}-${rule.max_purchase} tickets`);
  } else if (rule.min_purchase) {
    parts.push(`Minimum purchase: ${rule.min_purchase} tickets`);
  } else if (rule.max_purchase) {
    parts.push(`Maximum purchase: ${rule.max_purchase} tickets`);
  }

  return parts.join(' • ');
} 