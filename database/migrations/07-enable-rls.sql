-- Enable RLS on all tables
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_tickets_2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM registrations r
            WHERE r.id = payments.registration_id
            AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can view all payments" ON public.payments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'organizer'
        )
    );

CREATE POLICY "System can create payments" ON public.payments
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update payments" ON public.payments
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Create policies for payment_transactions
CREATE POLICY "Users can view their own transactions" ON public.payment_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM payments p
            JOIN registrations r ON r.id = p.registration_id
            WHERE p.id = payment_transactions.payment_id
            AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can view all transactions" ON public.payment_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'organizer'
        )
    );

CREATE POLICY "System can create transactions" ON public.payment_transactions
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update transactions" ON public.payment_transactions
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Create policies for payment_history
CREATE POLICY "Users can view their own payment history" ON public.payment_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM payments p
            JOIN registrations r ON r.id = p.registration_id
            WHERE p.id = payment_history.payment_id
            AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can view all payment history" ON public.payment_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'organizer'
        )
    );

CREATE POLICY "System can create payment history" ON public.payment_history
    FOR INSERT
    WITH CHECK (true);

-- Create policies for payment_analytics
CREATE POLICY "Only organizers can view analytics" ON public.payment_analytics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'organizer'
        )
    );

CREATE POLICY "System can update analytics" ON public.payment_analytics
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create policies for backup_tickets_2024
CREATE POLICY "Only organizers can access backup tickets" ON public.backup_tickets_2024
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'organizer'
        )
    );

-- Create policies for migration_tracking
CREATE POLICY "Only system can access migration tracking" ON public.migration_tracking
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create policies for payment_receipts
CREATE POLICY "Users can view their own receipts" ON public.payment_receipts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM payments p
            JOIN registrations r ON r.id = p.registration_id
            WHERE p.id = payment_receipts.payment_id
            AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can view all receipts" ON public.payment_receipts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'organizer'
        )
    );

CREATE POLICY "System can create receipts" ON public.payment_receipts
    FOR INSERT
    WITH CHECK (true);

-- Create policies for payment_methods
CREATE POLICY "Anyone can view payment methods" ON public.payment_methods
    FOR SELECT
    USING (true);

-- Create policies for payment_settings
CREATE POLICY "Only organizers can manage payment settings" ON public.payment_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'organizer'
        )
    ); 