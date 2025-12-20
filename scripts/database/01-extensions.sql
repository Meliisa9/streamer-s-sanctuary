-- ============================================
-- Required PostgreSQL Extensions
-- ============================================
-- Run this FIRST on a clean database before other scripts
-- These extensions enable cron jobs and HTTP calls
-- ============================================

-- pg_cron: Schedule recurring database tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- pg_net: Make HTTP requests from the database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Verify extensions are installed
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('pg_cron', 'pg_net');
