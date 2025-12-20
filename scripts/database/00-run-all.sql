-- ============================================
-- MASTER SETUP SCRIPT
-- ============================================
-- Run this to execute all setup scripts in order
-- 
-- NOTE: This file shows the execution order.
-- In Supabase SQL Editor, you may need to run
-- each file individually due to extension limits.
-- ============================================

-- Order of execution:
-- 1. 01-extensions.sql      - PostgreSQL extensions (pg_cron, pg_net)
-- 2. 02-storage-buckets.sql - Storage buckets for videos/media
-- 3. 03-site-settings.sql   - Default site configuration
-- 4. 04-role-permissions.sql - Permission matrix for roles
-- 5. 05-video-categories.sql - Video category defaults
-- 6. 06-cron-jobs.sql       - Automated background tasks
-- 7. 07-admin-setup.sql     - Grant admin access (manual step)

-- ============================================
-- QUICK SETUP CHECKLIST
-- ============================================
-- [ ] Run migrations (supabase db push)
-- [ ] Run 01-extensions.sql
-- [ ] Run 02-storage-buckets.sql
-- [ ] Run 03-site-settings.sql
-- [ ] Run 04-role-permissions.sql
-- [ ] Run 05-video-categories.sql
-- [ ] Run 06-cron-jobs.sql (update URL/key first!)
-- [ ] Run 07-admin-setup.sql (add your user ID)
-- [ ] Deploy edge functions (auto via GitHub Actions)
-- ============================================

\echo 'Run each numbered SQL file in order.'
\echo 'Start with 01-extensions.sql and end with 07-admin-setup.sql'
