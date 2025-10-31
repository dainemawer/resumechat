# Database Schema & Configuration

## Database Setup

ResumeChat uses Supabase PostgreSQL with the pgvector extension for semantic search capabilities.

### Enable pgvector Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Schema

### Users Table

```sql
CREATE TABLE users (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	clerk_id TEXT UNIQUE NOT NULL,
	email TEXT NOT NULL,
	name TEXT,
	stripe_customer_id TEXT,
	subscription_tier TEXT DEFAULT 'free',
	subscription_status TEXT,
	chat_count INTEGER DEFAULT 0,
	created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
```

### Resumes Table

```sql
CREATE TABLE resumes (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID REFERENCES users(id) ON DELETE CASCADE,
	raw_text TEXT NOT NULL,
	parsed_json JSONB NOT NULL,
	summary TEXT,
	share_slug TEXT UNIQUE NOT NULL,
	file_name TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE UNIQUE INDEX idx_resumes_share_slug ON resumes(share_slug);
CREATE INDEX idx_resumes_created_at ON resumes(created_at DESC);
```

### Embeddings Table

```sql
CREATE TABLE embeddings (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
	content TEXT NOT NULL,
	embedding VECTOR(1536) NOT NULL,
	created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_embeddings_resume_id ON embeddings(resume_id);
-- Vector index for similarity search (ivfflat for performance)
CREATE INDEX idx_embeddings_vector ON embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Chats Table

```sql
CREATE TABLE chats (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
	question TEXT NOT NULL,
	answer TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chats_resume_id ON chats(resume_id);
CREATE INDEX idx_chats_created_at ON chats(created_at DESC);
```

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID REFERENCES users(id) ON DELETE CASCADE,
	stripe_subscription_id TEXT UNIQUE,
	stripe_price_id TEXT,
	status TEXT NOT NULL,
	current_period_start TIMESTAMP,
	current_period_end TIMESTAMP,
	created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

## Row Level Security (RLS) Policies

### Users Table Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (clerk_id = auth.uid());

-- Users can update their own data
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (clerk_id = auth.uid());

-- Service role can insert (webhook)
CREATE POLICY "Service role can insert users"
ON users FOR INSERT
WITH CHECK (true);
```

### Resumes Table Policies

```sql
-- Enable RLS
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Users can read their own resumes
CREATE POLICY "Users can read own resumes"
ON resumes FOR SELECT
USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()));

-- Anyone can read resumes via share_slug (for public sharing)
CREATE POLICY "Public can read shared resumes"
ON resumes FOR SELECT
USING (true);

-- Users can insert their own resumes
CREATE POLICY "Users can insert own resumes"
ON resumes FOR INSERT
WITH CHECK (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()));

-- Users can delete their own resumes
CREATE POLICY "Users can delete own resumes"
ON resumes FOR DELETE
USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()));
```

### Embeddings Table Policies

```sql
-- Enable RLS
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Users can read embeddings for their resumes
CREATE POLICY "Users can read own embeddings"
ON embeddings FOR SELECT
USING (
	resume_id IN (
		SELECT id FROM resumes 
		WHERE user_id = (SELECT id FROM users WHERE clerk_id = auth.uid())
	)
);

-- Public can read embeddings for shared resumes
CREATE POLICY "Public can read shared embeddings"
ON embeddings FOR SELECT
USING (true);

-- Service role can insert embeddings
CREATE POLICY "Service role can insert embeddings"
ON embeddings FOR INSERT
WITH CHECK (true);
```

### Chats Table Policies

```sql
-- Enable RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Users can read chats for their resumes
CREATE POLICY "Users can read own chats"
ON chats FOR SELECT
USING (
	resume_id IN (
		SELECT id FROM resumes 
		WHERE user_id = (SELECT id FROM users WHERE clerk_id = auth.uid())
	)
);

-- Anyone can create chats (for public sharing)
CREATE POLICY "Anyone can create chats"
ON chats FOR INSERT
WITH CHECK (true);
```

### Subscriptions Table Policies

```sql
-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions"
ON subscriptions FOR SELECT
USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()));

-- Service role can manage subscriptions (webhook)
CREATE POLICY "Service role can manage subscriptions"
ON subscriptions FOR ALL
USING (true);
```

## Vector Similarity Search Function

```sql
CREATE OR REPLACE FUNCTION match_resume_chunks(
	query_embedding VECTOR(1536),
	match_resume_id UUID,
	match_threshold FLOAT DEFAULT 0.7,
	match_count INT DEFAULT 5
)
RETURNS TABLE (
	id UUID,
	content TEXT,
	similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
	RETURN QUERY
	SELECT
		embeddings.id,
		embeddings.content,
		1 - (embeddings.embedding <=> query_embedding) AS similarity
	FROM embeddings
	WHERE embeddings.resume_id = match_resume_id
		AND 1 - (embeddings.embedding <=> query_embedding) > match_threshold
	ORDER BY embeddings.embedding <=> query_embedding
	LIMIT match_count;
END;
$$;
```

## Database Maintenance

### Backup Strategy
- Supabase provides automatic daily backups
- Point-in-time recovery available
- Export data regularly for additional safety

### Performance Optimization
- Regularly update vector index statistics
- Monitor slow queries with Supabase logs
- Archive old chat data if volume grows significantly

### Monitoring
- Track table sizes
- Monitor RLS policy performance
- Review connection pool usage

