-- Store Categories Table
CREATE TABLE public.store_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'Gift',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Store Items Table
CREATE TABLE public.store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.store_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  item_type TEXT NOT NULL DEFAULT 'merchandise' CHECK (item_type IN ('merchandise', 'giveaway_entry', 'exclusive_content', 'casino_credit', 'custom')),
  -- Type-specific data (casino name, content URL, etc.)
  item_data JSONB DEFAULT '{}',
  -- Inventory management
  stock_quantity INTEGER, -- NULL = unlimited
  max_per_user INTEGER, -- NULL = unlimited
  -- Availability
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  -- Metadata
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Store Redemptions Table (secure audit trail)
CREATE TABLE public.store_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.store_items(id) ON DELETE RESTRICT,
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  -- Fulfillment data
  fulfillment_data JSONB DEFAULT '{}',
  notes TEXT,
  -- Admin actions
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_store_items_category ON public.store_items(category_id);
CREATE INDEX idx_store_items_active ON public.store_items(is_active, is_featured);
CREATE INDEX idx_store_items_type ON public.store_items(item_type);
CREATE INDEX idx_store_redemptions_user ON public.store_redemptions(user_id);
CREATE INDEX idx_store_redemptions_item ON public.store_redemptions(item_id);
CREATE INDEX idx_store_redemptions_status ON public.store_redemptions(status);

-- Enable RLS
ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_redemptions ENABLE ROW LEVEL SECURITY;

-- Store Categories Policies
CREATE POLICY "Active categories are viewable by everyone"
  ON public.store_categories FOR SELECT
  USING (is_active = true OR is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins can manage categories"
  ON public.store_categories FOR ALL
  USING (is_admin_or_mod(auth.uid()));

-- Store Items Policies
CREATE POLICY "Active items are viewable by everyone"
  ON public.store_items FOR SELECT
  USING (
    (is_active = true AND (available_from IS NULL OR available_from <= now()) AND (available_until IS NULL OR available_until >= now()))
    OR is_admin_or_mod(auth.uid())
  );

CREATE POLICY "Admins can manage items"
  ON public.store_items FOR ALL
  USING (is_admin_or_mod(auth.uid()));

-- Store Redemptions Policies (most critical for security)
CREATE POLICY "Users can view their own redemptions"
  ON public.store_redemptions FOR SELECT
  USING (auth.uid() = user_id OR is_admin_or_mod(auth.uid()));

CREATE POLICY "Users can create their own redemptions"
  ON public.store_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all redemptions"
  ON public.store_redemptions FOR ALL
  USING (is_admin_or_mod(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_store_categories_updated_at
  BEFORE UPDATE ON public.store_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_items_updated_at
  BEFORE UPDATE ON public.store_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_redemptions_updated_at
  BEFORE UPDATE ON public.store_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Secure function for redeeming items (prevents race conditions)
CREATE OR REPLACE FUNCTION public.redeem_store_item(
  p_item_id UUID,
  p_quantity INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_item RECORD;
  v_total_cost INTEGER;
  v_user_points INTEGER;
  v_user_redemptions INTEGER;
  v_redemption_id UUID;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Lock the item row to prevent race conditions
  SELECT * INTO v_item
  FROM store_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found');
  END IF;

  -- Check if item is active and available
  IF NOT v_item.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item is not available');
  END IF;

  IF v_item.available_from IS NOT NULL AND v_item.available_from > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item is not yet available');
  END IF;

  IF v_item.available_until IS NOT NULL AND v_item.available_until < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item is no longer available');
  END IF;

  -- Check stock
  IF v_item.stock_quantity IS NOT NULL AND v_item.stock_quantity < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock');
  END IF;

  -- Check max per user
  IF v_item.max_per_user IS NOT NULL THEN
    SELECT COALESCE(SUM(quantity), 0) INTO v_user_redemptions
    FROM store_redemptions
    WHERE user_id = v_user_id AND item_id = p_item_id AND status NOT IN ('cancelled', 'refunded');
    
    IF v_user_redemptions + p_quantity > v_item.max_per_user THEN
      RETURN jsonb_build_object('success', false, 'error', 'Maximum redemption limit reached for this item');
    END IF;
  END IF;

  -- Calculate total cost
  v_total_cost := v_item.points_cost * p_quantity;

  -- Get user points with lock
  SELECT points INTO v_user_points
  FROM profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_user_points IS NULL OR v_user_points < v_total_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient points');
  END IF;

  -- Deduct points
  UPDATE profiles
  SET points = points - v_total_cost
  WHERE user_id = v_user_id;

  -- Reduce stock if applicable
  IF v_item.stock_quantity IS NOT NULL THEN
    UPDATE store_items
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = p_item_id;
  END IF;

  -- Create redemption record
  INSERT INTO store_redemptions (user_id, item_id, points_spent, quantity)
  VALUES (v_user_id, p_item_id, v_total_cost, p_quantity)
  RETURNING id INTO v_redemption_id;

  -- Create notification for user
  INSERT INTO user_notifications (user_id, title, message, type, link)
  VALUES (
    v_user_id,
    'Redemption Successful!',
    'You redeemed ' || v_item.name || ' for ' || v_total_cost || ' points.',
    'achievement',
    '/store'
  );

  -- Create admin notification
  INSERT INTO admin_notifications (title, message, type, link)
  VALUES (
    'New Store Redemption',
    'A user redeemed ' || v_item.name || ' (' || p_quantity || 'x)',
    'store',
    '/admin/store'
  );

  RETURN jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'points_spent', v_total_cost,
    'new_balance', v_user_points - v_total_cost
  );
END;
$$;

-- Add audit logging for redemptions
CREATE TRIGGER audit_store_redemptions
  AFTER INSERT OR UPDATE OR DELETE ON public.store_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();