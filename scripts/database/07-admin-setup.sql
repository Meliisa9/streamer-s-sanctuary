-- ============================================
-- Admin User Setup
-- ============================================
-- Use this script to grant admin access to users
-- 
-- INSTRUCTIONS:
-- 1. First, find your user ID using the query below
-- 2. Replace 'your-user-id-here' with your actual UUID
-- 3. Run the INSERT statement
-- ============================================

-- Step 1: Find your user ID by email
-- Uncomment and run this query first:
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Step 2: Grant admin role (replace the UUID)
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('your-user-id-here', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- Quick reference: Role types
-- ============================================
-- 'user'      - Default role (auto-assigned on signup)
-- 'writer'    - Can create/edit articles
-- 'moderator' - Content management access
-- 'admin'     - Full system access
-- ============================================

-- View all users with their roles
SELECT 
  u.id,
  u.email,
  p.username,
  p.display_name,
  COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::app_role[]) as roles,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
GROUP BY u.id, u.email, p.username, p.display_name, u.created_at
ORDER BY u.created_at DESC;
