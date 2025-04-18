import { formatCurrency, formatDate, formatTime } from '@/lib/utils/format';

describe('Format Utilities', () => {
  describe('formatCurrency', () => {
    test('formats USD correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1000.50)).toBe('$1,000.50');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(-1000)).toBe('-$1,000.00');
    });

    test('formats other currencies correctly', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
      expect(formatCurrency(1000, 'GBP')).toBe('£1,000.00');
      expect(formatCurrency(1000, 'JPY')).toBe('¥1,000.00');
    });

    test('handles decimal places correctly', () => {
      expect(formatCurrency(1000.1)).toBe('$1,000.10');
      expect(formatCurrency(1000.12)).toBe('$1,000.12');
      expect(formatCurrency(1000.123)).toBe('$1,000.12');
      expect(formatCurrency(1000.129)).toBe('$1,000.13');
    });
  });

  describe('formatDate', () => {
    test('formats date with default options', () => {
      // Fixed date for testing: January 15, 2023
      const testDate = '2023-01-15T12:00:00Z';
      expect(formatDate(testDate)).toBe('January 15, 2023');
    });

    test('formats date with custom options', () => {
      const testDate = '2023-01-15T12:00:00Z';
      
      // Short format
      expect(formatDate(testDate, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })).toBe('Jan 15, 2023');
      
      // Numeric format
      expect(formatDate(testDate, { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      })).toBe('01/15/2023');
      
      // Weekday format
      expect(formatDate(testDate, { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })).toBe('Sunday, January 15, 2023');
    });

    test('handles different date strings correctly', () => {
      // ISO format
      expect(formatDate('2023-01-15')).toBe('January 15, 2023');
      
      // Date object
      const dateObj = new Date(2023, 0, 15); // Jan 15, 2023
      expect(formatDate(dateObj.toISOString())).toBe('January 15, 2023');
    });
  });

  describe('formatTime', () => {
    test('formats time correctly', () => {
      // Since formatTime output depends on user locale and timezone,
      // we'll just test that it returns a properly formatted time string
      // rather than expecting exact values
      const morningTime = formatTime('2023-01-15T08:30:00Z');
      expect(morningTime).toMatch(/^\d{1,2}:\d{2} [AP]M$/);
      
      const afternoonTime = formatTime('2023-01-15T14:30:00Z');
      expect(afternoonTime).toMatch(/^\d{1,2}:\d{2} [AP]M$/);
      
      const midnightTime = formatTime('2023-01-15T00:00:00Z');
      expect(midnightTime).toMatch(/^\d{1,2}:\d{2} [AP]M$/);
      
      const noonTime = formatTime('2023-01-15T12:00:00Z');
      expect(noonTime).toMatch(/^\d{1,2}:\d{2} [AP]M$/);
    });

    test('handles different time strings correctly', () => {
      // ISO format with timezone
      const isoTime = formatTime('2023-01-15T08:30:00+00:00');
      expect(isoTime).toMatch(/^\d{1,2}:\d{2} [AP]M$/);
      
      // Date object
      const dateObj = new Date(2023, 0, 15, 8, 30); // Jan 15, 2023, 8:30 AM
      const dateObjTime = formatTime(dateObj.toISOString());
      expect(dateObjTime).toMatch(/^\d{1,2}:\d{2} [AP]M$/);
    });
  });
}); 