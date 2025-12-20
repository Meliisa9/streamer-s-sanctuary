-- ============================================
-- Stream Status Auto-Check Cron Job
-- ============================================
-- This script sets up a cron job to automatically check stream status every 2 minutes.
-- 
-- PREREQUISITES:
-- 1. pg_cron and pg_net extensions must be enabled
-- 2. Replace YOUR_SUPABASE_URL with your Supabase project URL
-- 3. Replace YOUR_ANON_KEY with your Supabase anon/public key
--
-- Run this script in your Supabase SQL Editor or via psql
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing job if it exists (to allow re-running this script)
SELECT cron.unschedule('check-stream-status-auto') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-stream-status-auto'
);

-- Create the stream auto-check cron job (every 2 minutes)
SELECT cron.schedule(
  'check-stream-status-auto',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tuoovpieeejapujaujam.supabase.co/functions/v1/check-stream-status',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1b292cGllZWVqYXB1amF1amFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzA2ODAsImV4cCI6MjA2NTQwNjY4MH0.lHV2Gr0JTvFjJLbTsG2k2WrCJY81BX2z50SMjfPkrDQ'
    ),
    body := jsonb_build_object('source', 'cron', 'timestamp', now())
  ) AS request_id;
  $$
);

-- Verify the job was created
SELECT jobid, jobname, schedule, command 
FROM cron.job 
WHERE jobname = 'check-stream-status-auto';
