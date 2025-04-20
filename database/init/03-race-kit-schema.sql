-- Create race kit size enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'race_kit_size') THEN
        CREATE TYPE race_kit_size AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL');
    END IF;
END $$;

-- Create race kit type enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'race_kit_type') THEN
        CREATE TYPE race_kit_type AS ENUM ('standard', 'premium', 'elite');
    END IF;
END $$;

-- Create race kit status enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'race_kit_status') THEN
        CREATE TYPE race_kit_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock');
    END IF;
END $$;

-- Create pickup status enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pickup_status') THEN
        CREATE TYPE pickup_status AS ENUM ('pending', 'picked_up', 'cancelled');
    END IF;
END $$;

-- Create race_kit_inventory table
CREATE TABLE IF NOT EXISTS race_kit_inventory (
    kit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    size race_kit_size NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    type race_kit_type NOT NULL DEFAULT 'standard',
    status race_kit_status NOT NULL DEFAULT 'in_stock',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT race_kit_inventory_quantity_check CHECK (quantity >= 0),
    CONSTRAINT race_kit_inventory_unique_event_size_type UNIQUE (event_id, size, type)
);

-- Create kit_assignments table
CREATE TABLE IF NOT EXISTS kit_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kit_id UUID NOT NULL REFERENCES race_kit_inventory(kit_id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    pickup_status pickup_status NOT NULL DEFAULT 'pending',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ,
    notes TEXT,

    CONSTRAINT kit_assignments_unique_registration UNIQUE (registration_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_race_kit_inventory_event ON race_kit_inventory(event_id);
CREATE INDEX IF NOT EXISTS idx_kit_assignments_kit ON kit_assignments(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_assignments_registration ON kit_assignments(registration_id);

-- Enable Row Level Security
ALTER TABLE race_kit_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for race_kit_inventory
CREATE POLICY "Organizers can manage race kit inventory" ON race_kit_inventory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = (
                SELECT organizer_id FROM events WHERE id = race_kit_inventory.event_id
            )
            AND users.role = 'organizer'
        )
    );

CREATE POLICY "Everyone can view race kit inventory" ON race_kit_inventory
    FOR SELECT USING (TRUE);

-- Create RLS policies for kit_assignments
CREATE POLICY "Organizers can manage kit assignments" ON kit_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = (
                SELECT organizer_id FROM events 
                WHERE id = (
                    SELECT event_id FROM race_kit_inventory 
                    WHERE kit_id = kit_assignments.kit_id
                )
            )
            AND users.role = 'organizer'
        )
    );

CREATE POLICY "Runners can view their own kit assignments" ON kit_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM registrations
            WHERE registrations.id = kit_assignments.registration_id
            AND registrations.user_id = auth.uid()
        )
    );

-- Create function to update kit inventory status based on quantity
CREATE OR REPLACE FUNCTION update_kit_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on quantity thresholds
    IF NEW.quantity = 0 THEN
        NEW.status = 'out_of_stock';
    ELSIF NEW.quantity <= 10 THEN
        NEW.status = 'low_stock';
    ELSE
        NEW.status = 'in_stock';
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic status updates
CREATE TRIGGER update_kit_status
    BEFORE INSERT OR UPDATE OF quantity ON race_kit_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_kit_inventory_status();

-- Create function to update kit inventory quantity on assignment
CREATE OR REPLACE FUNCTION update_kit_quantity_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Decrease quantity when new assignment is created
        UPDATE race_kit_inventory
        SET quantity = quantity - 1
        WHERE kit_id = NEW.kit_id
        AND quantity > 0;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'No available kits in inventory';
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.pickup_status = 'pending' THEN
        -- Increase quantity when pending assignment is deleted
        UPDATE race_kit_inventory
        SET quantity = quantity + 1
        WHERE kit_id = OLD.kit_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic quantity updates
CREATE TRIGGER update_inventory_quantity
    AFTER INSERT OR DELETE ON kit_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_kit_quantity_on_assignment(); 