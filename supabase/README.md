# Supabase Database Setup

## Overview

This directory contains the database schema and migrations for ResumeChat.

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `resumechat` (or your preferred name)
   - Database Password: Strong password (save this securely)
   - Region: Choose closest to your users
5. Click "Create new project"

### 2. Run Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `migrations/20241101000000_initial_schema.sql`
4. Paste into the SQL Editor
5. Click "Run" or press `Cmd/Ctrl + Enter`
6. Verify all tables were created successfully

### 3. Enable Vector Index

After adding your first resume with embeddings:

```sql
CREATE INDEX idx_embeddings_vector ON embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Note:** This index requires at least some rows in the `embeddings` table to be created successfully.

### 4. Get API Keys

1. Go to **Settings** → **API**
2. Copy these values to your `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### 5. Configure Environment Variables

Update your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Keep this secret!
```

## Database Schema

### Tables

- **users** - User accounts (synced from Clerk)
- **resumes** - Uploaded and parsed resumes
- **embeddings** - Vector embeddings for semantic search
- **chats** - Chat interaction history
- **subscriptions** - Stripe subscription data

### Functions

- `match_resume_chunks()` - Vector similarity search
- `increment_chat_count()` - Update user chat count
- `reset_chat_counts()` - Monthly reset for free users

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Users can only access their own data
- Public users can read shared resumes via `share_slug`
- Service role has full access for webhooks

### Service Role Key

⚠️ **WARNING:** Never expose the service role key to the client!

Only use it in:
- API routes (server-side)
- Webhook handlers
- Server Actions
- Cron jobs

## Maintenance

### Monthly Tasks

Run this to reset free tier chat counts:

```sql
SELECT reset_chat_counts();
```

Recommended: Set up a Supabase cron job to run this automatically on the 1st of each month.

### Backup

Supabase provides automatic daily backups. For additional safety:

1. Go to **Database** → **Backups**
2. Enable point-in-time recovery (PITR) for Pro plan
3. Export data regularly for local backups

## Monitoring

### Performance

Monitor slow queries:

1. Go to **Database** → **Query Performance**
2. Review slow queries
3. Add indexes as needed

### Storage

Check database size:

```sql
SELECT 
	schemaname,
	tablename,
	pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting

### Migration Errors

If the migration fails:

1. Check the error message in SQL Editor
2. Verify pgvector extension is enabled
3. Ensure you have sufficient permissions
4. Try running sections individually

### RLS Policy Issues

Test RLS policies:

```sql
-- Test as authenticated user
SET request.jwt.claims = '{"sub": "user_clerk_id"}';

-- Your queries here

-- Reset
RESET request.jwt.claims;
```

### Vector Index Performance

If vector search is slow:

1. Ensure vector index is created
2. Check table has enough rows (minimum 1000 recommended)
3. Adjust `lists` parameter based on table size:
   - < 1K rows: lists = 10
   - 1K-10K rows: lists = 100
   - 10K-100K rows: lists = 500
   - > 100K rows: lists = 1000

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Vector Search Tutorial](https://supabase.com/docs/guides/ai/vector-search)

