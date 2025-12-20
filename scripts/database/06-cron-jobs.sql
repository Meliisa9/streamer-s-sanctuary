-- ============================================
-- Cron Jobs Setup
-- ============================================
-- Sets up automated background tasks
-- 
-- IMPORTANT: Update the URL and API key below!
-- ============================================

-- Ensure extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- Stream Status Auto-Check (every 2 minutes)
-- ============================================

-- Remove existing job if present (allows re-running)
DO $$
BEGIN
  PERFORM cron.unschedule('check-stream-status-auto');
EXCEPTION WHEN OTHERS THEN
  -- Job doesn't exist, continue
END $$;

-- Create the stream auto-check cron job
-- UPDATE THESE VALUES FOR YOUR ENVIRONMENT:
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

-- ============================================
-- Verify all cron jobs
-- ============================================
SELECT jobid, jobname, schedule, active 
FROM cron.job 
ORDER BY jobname;
