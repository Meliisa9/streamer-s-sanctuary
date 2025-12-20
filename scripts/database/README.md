# Database Scripts

This folder contains reusable SQL scripts for database setup and configuration.

## Scripts

### `setup-cron-jobs.sql`
Sets up automated cron jobs for the application:
- **Stream Status Auto-Check**: Checks if the stream is live every 2 minutes

## How to Use

1. Open your Supabase project's SQL Editor
2. Copy the contents of the script you want to run
3. Execute the SQL

Or via command line with psql:
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f scripts/database/setup-cron-jobs.sql
```

## Notes

- These scripts contain environment-specific values (URLs, API keys)
- Update the values to match your Supabase project before running
- Scripts are designed to be idempotent (safe to run multiple times)
