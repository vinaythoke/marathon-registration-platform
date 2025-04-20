DO $$ 
BEGIN
    -- Drop existing table if it exists
    DROP TABLE IF EXISTS payment_methods CASCADE;
    
    -- Create new table
    CREATE TABLE payment_methods (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        method_code VARCHAR(50) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT payment_methods_unique_code_provider UNIQUE (method_code, provider)
    );

    -- Insert default payment methods
    INSERT INTO payment_methods (name, method_code, provider) VALUES
        ('Credit Card', 'cc', 'cashfree'),
        ('Debit Card', 'dc', 'cashfree'),
        ('UPI', 'upi', 'cashfree'),
        ('Net Banking', 'nb', 'cashfree'),
        ('Wallet', 'wallet', 'cashfree')
    ON CONFLICT ON CONSTRAINT payment_methods_unique_code_provider 
    DO NOTHING;

EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error occurred: %', SQLERRM;
END $$;

-- Add payment method reference to payments table
ALTER TABLE payments ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id);

-- Add indexes
CREATE INDEX idx_payment_methods_code ON payment_methods(method_code);
CREATE INDEX idx_payment_methods_provider ON payment_methods(provider);

-- Create payment_method_analytics table to track usage
CREATE TABLE IF NOT EXISTS payment_method_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
    total_transactions INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, payment_method_id, date)
);

-- Add indexes for payment_method_analytics
CREATE INDEX IF NOT EXISTS idx_payment_method_analytics_event ON payment_method_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_method_analytics_method ON payment_method_analytics(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_method_analytics_date ON payment_method_analytics(date);

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
    ON CONFLICT (event_id, payment_method_id, date)
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