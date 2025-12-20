# Database Setup Scripts

This folder contains reusable SQL scripts for database setup and configuration.

## Quick Start (Clean Database)

1. **Run migrations first** (handled by Supabase CLI):
   ```bash
   supabase db push
   ```

2. **Run setup scripts in order**:
   - `01-extensions.sql` - Enable pg_cron and pg_net
   - `02-storage-buckets.sql` - Create storage buckets
   - `03-site-settings.sql` - Initialize site configuration
   - `04-role-permissions.sql` - Set up role permissions
   - `05-video-categories.sql` - Create video categories
   - `06-cron-jobs.sql` - Set up automated tasks (**UPDATE URL/KEY FIRST!**)
   - `07-admin-setup.sql` - Grant yourself admin access

## Script Descriptions

| Script | Purpose | Re-runnable |
|--------|---------|-------------|
| `01-extensions.sql` | Enables required PostgreSQL extensions | ✅ Yes |
| `02-storage-buckets.sql` | Creates video and media storage buckets | ✅ Yes |
| `03-site-settings.sql` | Initializes default site settings | ✅ Yes |
| `04-role-permissions.sql` | Sets up permission matrix for roles | ✅ Yes |
| `05-video-categories.sql` | Creates default video categories | ✅ Yes |
| `06-cron-jobs.sql` | Sets up background automation tasks | ✅ Yes |
| `07-admin-setup.sql` | Template for granting admin access | Manual |

## Environment-Specific Values

**Before running `06-cron-jobs.sql`**, update these values:
- `url` - Your Supabase project URL
- `Authorization` header - Your Supabase anon key

## FAQ

### Do I need to run these every time?

**Migrations** (`supabase/migrations/`): Run automatically with `supabase db push`

**These scripts** (`scripts/database/`): Run manually on:
- Fresh database setup
- After `supabase db reset`
- When giving the project to someone else

### How to run via command line?

```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f scripts/database/01-extensions.sql
```

### How to run in Supabase Dashboard?

1. Go to SQL Editor
2. Copy the contents of each script
3. Run them in order (01 → 07)

## Troubleshooting

**"extension does not exist"**: Your Supabase plan may not support pg_cron. Contact Supabase support.

**"permission denied"**: Some operations require the `postgres` role. Use the SQL Editor in the dashboard.

**Cron job not running**: Check the logs with:
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```
