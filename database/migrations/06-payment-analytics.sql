-- Create payment_method_analytics table
CREATE TABLE payment_method_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id),
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
    total_transactions INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_daily_analytics UNIQUE (event_id, payment_method_id, date)
);

-- Add indexes for payment_method_analytics
CREATE INDEX idx_payment_method_analytics_event ON payment_method_analytics(event_id);
CREATE INDEX idx_payment_method_analytics_method ON payment_method_analytics(payment_method_id);
CREATE INDEX idx_payment_method_analytics_date ON payment_method_analytics(date);

-- Function to update payment method analytics
CREATE OR REPLACE FUNCTION update_payment_method_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO payment_method_analytics (
        event_id,
        payment_method_id,
        total_transactions,
        total_amount,
        success_count,
        failure_count,
        date
    )
    VALUES (
        NEW.event_id,
        NEW.payment_method_id,
        1,
        NEW.amount,
        CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
        DATE(NEW.created_at)
    )
    ON CONFLICT ON CONSTRAINT unique_daily_analytics
    DO UPDATE SET
        total_transactions = payment_method_analytics.total_transactions + 1,
        total_amount = payment_method_analytics.total_amount + EXCLUDED.total_amount,
        success_count = payment_method_analytics.success_count + EXCLUDED.success_count,
        failure_count = payment_method_analytics.failure_count + EXCLUDED.failure_count,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment analytics
DROP TRIGGER IF EXISTS payment_method_analytics_trigger ON payments;
CREATE TRIGGER payment_method_analytics_trigger
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_method_analytics(); 