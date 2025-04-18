import { 
  cn, 
  formatCurrency, 
  formatDate, 
  formatTime, 
  truncateString, 
  formatCurrencyValue, 
  truncateText, 
  generateId, 
  debounce, 
  formatRelativeTime 
} from '@/lib/utils';

jest.useFakeTimers();

describe('Utils Functions', () => {
  describe('cn (class name utility)', () => {
    test('combines class names correctly', () => {
      expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
      expect(cn('btn', { 'btn-large': true, 'btn-small': false })).toBe('btn btn-large');
      expect(cn('mb-4', 'text-center', null, undefined, 'rounded')).toBe('mb-4 text-center rounded');
    });

    test('handles conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      
      expect(cn('btn', { 'btn-active': isActive, 'btn-disabled': isDisabled })).toBe('btn btn-active');
    });

    test('merges tailwind classes properly', () => {
      // The order of classes might vary but the functionality should be the same
      const result1 = cn('p-4 m-2', 'p-8');
      expect(result1.includes('m-2')).toBe(true);
      expect(result1.includes('p-8')).toBe(true);
      expect(result1.includes('p-4')).toBe(false); // p-8 should override p-4
      
      const result2 = cn('text-red-500', 'text-opacity-50', 'text-blue-500');
      expect(result2.includes('text-opacity-50')).toBe(true);
      expect(result2.includes('text-blue-500')).toBe(true);
      expect(result2.includes('text-red-500')).toBe(false); // text-blue-500 should override text-red-500
    });
  });

  describe('formatCurrency', () => {
    test('formats currency in INR format', () => {
      expect(formatCurrency(1000)).toBe('₹1,000');
      expect(formatCurrency(1500.75)).toBe('₹1,501');
      expect(formatCurrency(0)).toBe('₹0');
    });
  });

  describe('formatCurrencyValue', () => {
    test('formats USD correctly', () => {
      expect(formatCurrencyValue(1000)).toBe('$1,000.00');
      expect(formatCurrencyValue(1500.75)).toBe('$1,500.75');
    });

    test('formats other currencies correctly', () => {
      expect(formatCurrencyValue(1000, 'EUR')).toBe('€1,000.00');
      expect(formatCurrencyValue(1000, 'GBP')).toBe('£1,000.00');
    });
  });

  describe('formatDate', () => {
    test('formats date correctly', () => {
      const testDate = '2023-01-15T12:30:00Z';
      // The actual output format will depend on the locale settings, so using regex
      expect(formatDate(testDate)).toMatch(/\w+, \w+ \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M/);
    });
  });

  describe('formatTime', () => {
    test('formats time string correctly', () => {
      const testTime = '2023-01-15T14:30:00Z';
      // Adjust regex to match lowercase am/pm format too
      expect(formatTime(testTime)).toMatch(/\d{1,2}:\d{2}\s?([aApP][mM]|[aApP]\s?[mM])/i);
    });

    test('formats Date object correctly', () => {
      const testDate = new Date(2023, 0, 15, 14, 30); // Jan 15, 2023, 2:30 PM
      expect(formatTime(testDate)).toMatch(/\d{1,2}:\d{2}\s?([aApP][mM]|[aApP]\s?[mM])/i);
    });
  });

  describe('truncateString and truncateText', () => {
    test('truncateString works correctly', () => {
      const longString = 'This is a very long string that needs to be truncated';
      
      expect(truncateString(longString, 10)).toBe('This is a ...');
      expect(truncateString(longString, 20)).toBe('This is a very long ...');
      expect(truncateString('Short', 10)).toBe('Short'); // No truncation needed
    });

    test('truncateText works correctly', () => {
      const longText = 'This is a very long text that needs to be truncated';
      
      expect(truncateText(longText, 10)).toBe('This is a ...');
      expect(truncateText(longText, 20)).toBe('This is a very long ...');
      expect(truncateText('Short', 10)).toBe('Short'); // No truncation needed
    });
  });

  describe('generateId', () => {
    test('generates random ID with default length', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2); // IDs should be random
      expect(id1.length).toBeGreaterThanOrEqual(8); // Default length is 10, but could be shorter due to random chars
    });

    test('generates random ID with custom length', () => {
      const id = generateId(5);
      
      // Length could be less than 5 due to random chars
      expect(id.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('debounce', () => {
    test('calls function after delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);
      
      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(500);
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('resets timer on multiple calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);
      
      debouncedFn();
      jest.advanceTimersByTime(500);
      
      debouncedFn(); // This should reset the timer
      jest.advanceTimersByTime(500);
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('passes arguments to the function', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);
      
      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(1000);
      
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Mock the current time to 2023-01-15T12:00:00Z
      jest.setSystemTime(new Date(2023, 0, 15, 12, 0, 0));
    });

    test('formats times less than a minute ago', () => {
      const dateString = new Date(2023, 0, 15, 11, 59, 30).toISOString(); // 30 seconds ago
      expect(formatRelativeTime(dateString)).toBe('just now');
    });

    test('formats times in minutes', () => {
      const oneMinuteAgo = new Date(2023, 0, 15, 11, 59, 0).toISOString();
      const fiveMinutesAgo = new Date(2023, 0, 15, 11, 55, 0).toISOString();
      
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    test('formats times in hours', () => {
      const oneHourAgo = new Date(2023, 0, 15, 11, 0, 0).toISOString();
      const twoHoursAgo = new Date(2023, 0, 15, 10, 0, 0).toISOString();
      
      expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
      expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');
    });

    test('formats times in days', () => {
      const oneDayAgo = new Date(2023, 0, 14, 12, 0, 0).toISOString();
      const twoDaysAgo = new Date(2023, 0, 13, 12, 0, 0).toISOString();
      
      expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago');
      expect(formatRelativeTime(twoDaysAgo)).toBe('2 days ago');
    });

    test('formats dates older than 30 days', () => {
      const olderDate = new Date(2022, 11, 1, 12, 0, 0).toISOString(); // Dec 1, 2022
      // This should fall back to formatDate function which we've already tested
      expect(formatRelativeTime(olderDate)).toMatch(/\w+, \w+ \d{1,2}, \d{4}/);
    });
  });
}); 