-- Fix search path for update_kit_inventory_status function
CREATE OR REPLACE FUNCTION public.update_kit_inventory_status()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
$$;

-- Fix search path for update_kit_quantity_on_assignment function
CREATE OR REPLACE FUNCTION public.update_kit_quantity_on_assignment()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
$$; 