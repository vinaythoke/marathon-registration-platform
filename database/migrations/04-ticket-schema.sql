-- Create ticket type enum
CREATE TYPE ticket_type AS ENUM ('regular', 'early_bird', 'vip', 'group', 'student');
CREATE TYPE ticket_status AS ENUM ('active', 'sold_out', 'draft', 'archived');
CREATE TYPE ticket_instance_status AS ENUM ('valid', 'used', 'cancelled', 'refunded');
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create ticket types table
CREATE TABLE ticket_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ticket_type NOT NULL DEFAULT 'regular',
    base_price DECIMAL(10,2) NOT NULL,
    pricing_rules JSONB,
    quantity_total INTEGER NOT NULL,
    quantity_sold INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    status ticket_status NOT NULL DEFAULT 'draft',
    visibility_rules JSONB,
    features TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_quantities CHECK (
        quantity_total >= 0 AND
        quantity_sold >= 0 AND
        quantity_reserved >= 0 AND
        (quantity_sold + quantity_reserved) <= quantity_total
    )
);

-- Create ticket orders table
CREATE TABLE ticket_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    total_amount DECIMAL(10,2) NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    payment_id VARCHAR(255),
    payment_method VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tickets table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
    registration_id UUID REFERENCES registrations(id),
    order_id UUID NOT NULL REFERENCES ticket_orders(id) ON DELETE RESTRICT,
    price_paid DECIMAL(10,2) NOT NULL,
    status ticket_instance_status NOT NULL DEFAULT 'valid',
    check_in_time TIMESTAMP WITH TIME ZONE,
    transfer_history JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_ticket_types_event ON ticket_types(event_id);
CREATE INDEX idx_ticket_orders_user ON ticket_orders(user_id);
CREATE INDEX idx_ticket_orders_event ON ticket_orders(event_id);
CREATE INDEX idx_tickets_type ON tickets(ticket_type_id);
CREATE INDEX idx_tickets_order ON tickets(order_id);
CREATE INDEX idx_tickets_registration ON tickets(registration_id);

-- Create trigger to update quantity_sold
CREATE OR REPLACE FUNCTION update_ticket_type_quantities()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'valid' THEN
        UPDATE ticket_types
        SET quantity_sold = quantity_sold + 1
        WHERE id = NEW.ticket_type_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'valid' AND NEW.status IN ('cancelled', 'refunded') THEN
            UPDATE ticket_types
            SET quantity_sold = quantity_sold - 1
            WHERE id = NEW.ticket_type_id;
        ELSIF OLD.status IN ('cancelled', 'refunded') AND NEW.status = 'valid' THEN
            UPDATE ticket_types
            SET quantity_sold = quantity_sold + 1
            WHERE id = NEW.ticket_type_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_quantities
    AFTER INSERT OR UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_type_quantities();

-- Add RLS policies
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Ticket types policies
CREATE POLICY "Organizers can manage ticket types for their events" ON ticket_types
    USING (
        event_id IN (
            SELECT id FROM events WHERE organizer_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view active ticket types" ON ticket_types
    FOR SELECT
    USING (status = 'active');

-- Ticket orders policies
CREATE POLICY "Users can view their own orders" ON ticket_orders
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own orders" ON ticket_orders
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Tickets policies
CREATE POLICY "Users can view their own tickets" ON tickets
    FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM ticket_orders WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can view tickets for their events" ON tickets
    FOR SELECT
    USING (
        ticket_type_id IN (
            SELECT tt.id FROM ticket_types tt
            JOIN events e ON tt.event_id = e.id
            WHERE e.organizer_id = auth.uid()
        )
    ); 