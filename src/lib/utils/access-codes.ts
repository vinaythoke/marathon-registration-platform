import { TicketTypeSchema } from '@/types/ticket';

/**
 * Check if a ticket type requires an access code
 */
export function requiresAccessCode(ticket: TicketTypeSchema): boolean {
  return Boolean(ticket.visibility_rules?.access_codes?.length);
}

/**
 * Validate an access code for a ticket type
 */
export function validateAccessCode(ticket: TicketTypeSchema, code: string): boolean {
  if (!ticket.visibility_rules?.access_codes?.length) {
    return true; // No access code required
  }
  
  // Case-insensitive comparison
  const normalizedCode = code.trim().toLowerCase();
  return ticket.visibility_rules.access_codes.some(
    validCode => validCode.toLowerCase() === normalizedCode
  );
}

/**
 * Get access code requirement message
 */
export function getAccessCodeMessage(ticket: TicketTypeSchema): string {
  if (!ticket.visibility_rules?.access_codes?.length) {
    return '';
  }
  return 'This ticket requires an access code. Please enter your code to proceed.';
}

/**
 * Check if a ticket is visible based on its visibility rules
 */
export function isTicketVisible(ticket: TicketTypeSchema): boolean {
  const now = new Date();
  const rules = ticket.visibility_rules;
  
  if (!rules) {
    return true;
  }
  
  // Check date restrictions
  if (rules.start_date && new Date(rules.start_date) > now) {
    return false;
  }
  
  if (rules.end_date && new Date(rules.end_date) < now) {
    return false;
  }
  
  // Check role restrictions
  // Note: This will be used in conjunction with the user's role from auth context
  if (rules.restricted_to?.length) {
    // The actual role check will be done in the component
    return false;
  }
  
  return true;
} 