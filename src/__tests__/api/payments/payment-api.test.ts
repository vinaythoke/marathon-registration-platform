import { createServerSupabaseClient } from '@/lib/services/payment-service';
import { GET as getHistory } from '@/app/api/payments/history/[paymentId]/route';
import { GET as getAnalytics } from '@/app/api/payments/analytics/[eventId]/route';
import { GET as getReceipt } from '@/app/api/payments/receipt/[paymentId]/route';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => {
      return {
        status: init?.status || 200,
        json: async () => data
      };
    }
  }
}));

// Mock Request
global.Request = class MockRequest {
  url: string;
  constructor(input: string | URL) {
    this.url = input.toString();
  }
} as any;

// Mock the createServerSupabaseClient
jest.mock('@/lib/services/payment-service', () => ({
  createServerSupabaseClient: jest.fn()
}));

describe('Payment API Endpoints', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new mock for each test
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis()
    };
    
    (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('GET /api/payments/history/[paymentId]', () => {
    const mockPaymentId = 'test-payment-id';
    const mockHistory = [
      { id: 1, status: 'pending', amount: 100 },
      { id: 2, status: 'completed', amount: 100 }
    ];

    it('should return payment history successfully', async () => {
      mockSupabase.order.mockResolvedValue({ data: mockHistory, error: null });

      const response = await getHistory(
        new Request('http://localhost:3000/api/payments/history/' + mockPaymentId),
        { params: { paymentId: mockPaymentId } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.history).toEqual(mockHistory);
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_history');
      expect(mockSupabase.eq).toHaveBeenCalledWith('payment_id', mockPaymentId);
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should handle database errors', async () => {
      mockSupabase.order.mockResolvedValue({ data: null, error: new Error('Database error') });

      const response = await getHistory(
        new Request('http://localhost:3000/api/payments/history/' + mockPaymentId),
        { params: { paymentId: mockPaymentId } }
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch payment history');
    });
  });

  describe('GET /api/payments/analytics/[eventId]', () => {
    const mockEventId = 'test-event-id';
    const mockAnalytics = [
      { 
        date: '2024-01-01', 
        total_payments: 10, 
        total_amount: 1000,
        successful_payments: 8,
        failed_payments: 1,
        refunded_payments: 1
      },
      { 
        date: '2024-01-02', 
        total_payments: 5, 
        total_amount: 500,
        successful_payments: 4,
        failed_payments: 1,
        refunded_payments: 0
      }
    ];

    it('should return analytics with date filtering and correct totals', async () => {
      mockSupabase.order.mockResolvedValue({ data: mockAnalytics, error: null });

      const response = await getAnalytics(
        new Request('http://localhost:3000/api/payments/analytics/' + mockEventId + '?startDate=2024-01-01&endDate=2024-01-02'),
        { params: { eventId: mockEventId } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.daily).toEqual(mockAnalytics);
      
      // Verify totals calculation
      expect(data.totals).toEqual({
        total_payments: 15, // 10 + 5
        total_amount: 1500, // 1000 + 500
        successful_payments: 12, // 8 + 4
        failed_payments: 2, // 1 + 1
        refunded_payments: 1, // 1 + 0
        average_amount: 100 // 1500 / 15
      });

      // Verify query construction
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_analytics');
      expect(mockSupabase.eq).toHaveBeenCalledWith('event_id', mockEventId);
      expect(mockSupabase.gte).toHaveBeenCalledWith('date', '2024-01-01');
      expect(mockSupabase.lte).toHaveBeenCalledWith('date', '2024-01-02');
      expect(mockSupabase.order).toHaveBeenCalledWith('date', { ascending: false });
    });

    it('should handle empty analytics data', async () => {
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const response = await getAnalytics(
        new Request('http://localhost:3000/api/payments/analytics/' + mockEventId),
        { params: { eventId: mockEventId } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.daily).toEqual([]);
      expect(data.totals).toEqual({
        total_payments: 0,
        total_amount: 0,
        successful_payments: 0,
        failed_payments: 0,
        refunded_payments: 0,
        average_amount: 0
      });
    });

    it('should handle database errors', async () => {
      mockSupabase.order.mockResolvedValue({ data: null, error: new Error('Database error') });

      const response = await getAnalytics(
        new Request('http://localhost:3000/api/payments/analytics/' + mockEventId),
        { params: { eventId: mockEventId } }
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch payment analytics');
    });
  });

  describe('GET /api/payments/receipt/[paymentId]', () => {
    const mockPaymentId = 'test-payment-id';
    const mockReceipt = {
      id: 1,
      payment_id: mockPaymentId,
      receipt_number: 'RCP-12345',
      receipt_data: { amount: 100 }
    };

    it('should return receipt successfully', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockReceipt, error: null });

      const response = await getReceipt(
        new Request('http://localhost:3000/api/payments/receipt/' + mockPaymentId),
        { params: { paymentId: mockPaymentId } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.receipt).toEqual(mockReceipt);
      expect(mockSupabase.from).toHaveBeenCalledWith('payment_receipts');
      expect(mockSupabase.eq).toHaveBeenCalledWith('payment_id', mockPaymentId);
    });

    it('should handle database errors', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Database error') });

      const response = await getReceipt(
        new Request('http://localhost:3000/api/payments/receipt/' + mockPaymentId),
        { params: { paymentId: mockPaymentId } }
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch receipt');
    });
  });
}); 