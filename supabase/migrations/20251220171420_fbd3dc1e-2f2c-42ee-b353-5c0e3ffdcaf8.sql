-- Create custom_roles table for admin-created custom roles
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  color text DEFAULT '#6B7280',
  icon text DEFAULT 'User',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for custom_roles
CREATE POLICY "Custom roles are viewable by everyone"
ON public.custom_roles FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage custom roles"
ON public.custom_roles FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create custom_role_permissions table to store permissions for custom roles
CREATE TABLE IF NOT EXISTS public.custom_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  permission text NOT NULL,
  allowed boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(custom_role_id, permission)
);

-- Enable RLS
ALTER TABLE public.custom_role_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for custom_role_permissions
CREATE POLICY "Custom role permissions are viewable by everyone"
ON public.custom_role_permissions FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage custom role permissions"
ON public.custom_role_permissions FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create user_custom_roles to assign custom roles to users
CREATE TABLE IF NOT EXISTS public.user_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, custom_role_id)
);

-- Enable RLS
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_custom_roles
CREATE POLICY "User custom roles are viewable by admins and mods"
ON public.user_custom_roles FOR SELECT
USING (is_admin_or_mod(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Only admins can manage user custom roles"
ON public.user_custom_roles FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Update has_permission function to also check custom role permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check built-in role permissions
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id 
      AND rp.permission = _permission 
      AND rp.allowed = true
  ) OR EXISTS (
    -- Check custom role permissions
    SELECT 1
    FROM public.user_custom_roles ucr
    JOIN public.custom_role_permissions crp ON ucr.custom_role_id = crp.custom_role_id
    WHERE ucr.user_id = _user_id
      AND crp.permission = _permission
      AND crp.allowed = true
  )
$$;