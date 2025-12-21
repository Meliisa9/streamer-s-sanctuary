-- Table to store user channel points from Twitch and Kick
CREATE TABLE public.user_channel_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'kick')),
  platform_user_id TEXT,
  platform_username TEXT,
  points_balance INTEGER NOT NULL DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Index for quick lookups
CREATE INDEX idx_user_channel_points_user_platform ON user_channel_points(user_id, platform);

-- Enable RLS
ALTER TABLE public.user_channel_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own channel points"
  ON public.user_channel_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own channel points"
  ON public.user_channel_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channel points"
  ON public.user_channel_points FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channel points"
  ON public.user_channel_points FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all channel points"
  ON public.user_channel_points FOR ALL
  USING (is_admin_or_mod(auth.uid()));

-- Table to track channel points transactions/redemptions
CREATE TABLE public.channel_point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'kick')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('redemption', 'refund', 'sync', 'adjustment')),
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for user transaction history
CREATE INDEX idx_channel_point_transactions_user ON channel_point_transactions(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.channel_point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions"
  ON public.channel_point_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON public.channel_point_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all transactions"
  ON public.channel_point_transactions FOR SELECT
  USING (is_admin_or_mod(auth.uid()));

-- Add currency support to store_items
ALTER TABLE public.store_items 
ADD COLUMN IF NOT EXISTS accepted_currencies TEXT[] DEFAULT ARRAY['site']::TEXT[];

-- Add points costs for different currencies
ALTER TABLE public.store_items
ADD COLUMN IF NOT EXISTS twitch_points_cost INTEGER,
ADD COLUMN IF NOT EXISTS kick_points_cost INTEGER;

-- Add currency tracking to store_redemptions
ALTER TABLE public.store_redemptions
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'site',
ADD COLUMN IF NOT EXISTS platform_points_spent INTEGER DEFAULT 0;

-- Function to redeem with channel points
CREATE OR REPLACE FUNCTION public.redeem_store_item_with_currency(
  p_item_id UUID, 
  p_quantity INTEGER DEFAULT 1,
  p_currency TEXT DEFAULT 'site'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_item RECORD;
  v_total_cost INTEGER;
  v_user_points INTEGER;
  v_user_redemptions INTEGER;
  v_redemption_id UUID;
  v_channel_points RECORD;
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

  -- Check if currency is accepted
  IF NOT (p_currency = ANY(v_item.accepted_currencies)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This currency is not accepted for this item');
  END IF;

  -- Determine cost based on currency
  IF p_currency = 'site' THEN
    v_total_cost := v_item.points_cost * p_quantity;
  ELSIF p_currency = 'twitch' THEN
    IF v_item.twitch_points_cost IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Twitch points not configured for this item');
    END IF;
    v_total_cost := v_item.twitch_points_cost * p_quantity;
  ELSIF p_currency = 'kick' THEN
    IF v_item.kick_points_cost IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Kick points not configured for this item');
    END IF;
    v_total_cost := v_item.kick_points_cost * p_quantity;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid currency');
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

  -- Handle different currencies
  IF p_currency = 'site' THEN
    -- Get user site points with lock
    SELECT points INTO v_user_points
    FROM profiles
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF v_user_points IS NULL OR v_user_points < v_total_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient site points');
    END IF;

    -- Deduct site points
    UPDATE profiles
    SET points = points - v_total_cost
    WHERE user_id = v_user_id;

  ELSE
    -- Get channel points with lock
    SELECT * INTO v_channel_points
    FROM user_channel_points
    WHERE user_id = v_user_id AND platform = p_currency
    FOR UPDATE;

    IF NOT FOUND OR v_channel_points.points_balance < v_total_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient ' || p_currency || ' points');
    END IF;

    -- Deduct channel points
    UPDATE user_channel_points
    SET points_balance = points_balance - v_total_cost,
        updated_at = now()
    WHERE user_id = v_user_id AND platform = p_currency;

    -- Record transaction
    INSERT INTO channel_point_transactions (
      user_id, platform, transaction_type, amount, 
      balance_before, balance_after, reference_type, description
    ) VALUES (
      v_user_id, p_currency, 'redemption', -v_total_cost,
      v_channel_points.points_balance, v_channel_points.points_balance - v_total_cost,
      'store_redemption', 'Redeemed ' || v_item.name
    );
  END IF;

  -- Reduce stock if applicable
  IF v_item.stock_quantity IS NOT NULL THEN
    UPDATE store_items
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = p_item_id;
  END IF;

  -- Create redemption record
  INSERT INTO store_redemptions (user_id, item_id, points_spent, quantity, currency, platform_points_spent)
  VALUES (
    v_user_id, 
    p_item_id, 
    CASE WHEN p_currency = 'site' THEN v_total_cost ELSE 0 END,
    p_quantity,
    p_currency,
    CASE WHEN p_currency != 'site' THEN v_total_cost ELSE 0 END
  )
  RETURNING id INTO v_redemption_id;

  -- Create notification for user
  INSERT INTO user_notifications (user_id, title, message, type, link)
  VALUES (
    v_user_id,
    'Redemption Successful!',
    'You redeemed ' || v_item.name || ' for ' || v_total_cost || ' ' || p_currency || ' points.',
    'achievement',
    '/store'
  );

  -- Create admin notification
  INSERT INTO admin_notifications (title, message, type, link)
  VALUES (
    'New Store Redemption',
    'A user redeemed ' || v_item.name || ' (' || p_quantity || 'x) with ' || p_currency || ' points',
    'store',
    '/admin/store'
  );

  -- Return appropriate balance
  IF p_currency = 'site' THEN
    RETURN jsonb_build_object(
      'success', true,
      'redemption_id', v_redemption_id,
      'points_spent', v_total_cost,
      'currency', p_currency,
      'new_balance', v_user_points - v_total_cost
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true,
      'redemption_id', v_redemption_id,
      'points_spent', v_total_cost,
      'currency', p_currency,
      'new_balance', v_channel_points.points_balance - v_total_cost
    );
  END IF;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_user_channel_points_updated_at
  BEFORE UPDATE ON user_channel_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for channel points
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_channel_points;