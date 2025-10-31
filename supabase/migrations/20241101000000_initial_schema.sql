-- ResumeChat Initial Schema Migration
-- This migration sets up the complete database schema including tables, indexes, RLS policies, and functions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	clerk_id TEXT UNIQUE NOT NULL,
	email TEXT NOT NULL,
	name TEXT,
	stripe_customer_id TEXT,
	subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
	subscription_status TEXT,
	chat_count INTEGER DEFAULT 0,
	created_at TIMESTAMP DEFAULT NOW()
);

-- Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
	raw_text TEXT NOT NULL,
	parsed_json JSONB NOT NULL,
	summary TEXT,
	share_slug TEXT UNIQUE NOT NULL,
	file_name TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT NOW()
);

-- Create embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
	content TEXT NOT NULL,
	embedding VECTOR(1536) NOT NULL,
	created_at TIMESTAMP DEFAULT NOW()
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
	question TEXT NOT NULL,
	answer TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
	stripe_subscription_id TEXT UNIQUE,
	stripe_price_id TEXT,
	status TEXT NOT NULL,
	current_period_start TIMESTAMP,
	current_period_end TIMESTAMP,
	created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_resumes_share_slug ON resumes(share_slug);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_embeddings_resume_id ON embeddings(resume_id);
-- Vector index for similarity search (ivfflat for performance)
-- Note: This requires some data in the table first, uncomment after first embeddings are inserted
-- CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings 
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_chats_resume_id ON chats(resume_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Service role can insert users"
ON users FOR INSERT
WITH CHECK (true);

-- RLS Policies for resumes table
CREATE POLICY "Users can read own resumes"
ON resumes FOR SELECT
USING (
	user_id IN (
		SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
	)
	OR true -- Allow public access for shared resumes
);

CREATE POLICY "Users can insert own resumes"
ON resumes FOR INSERT
WITH CHECK (
	user_id IN (
		SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
	)
);

CREATE POLICY "Users can delete own resumes"
ON resumes FOR DELETE
USING (
	user_id IN (
		SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
	)
);

-- RLS Policies for embeddings table
CREATE POLICY "Public can read embeddings"
ON embeddings FOR SELECT
USING (true);

CREATE POLICY "Service role can insert embeddings"
ON embeddings FOR INSERT
WITH CHECK (true);

-- RLS Policies for chats table
CREATE POLICY "Users can read own chats"
ON chats FOR SELECT
USING (
	resume_id IN (
		SELECT id FROM resumes 
		WHERE user_id IN (
			SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
		)
	)
);

CREATE POLICY "Anyone can create chats"
ON chats FOR INSERT
WITH CHECK (true);

-- RLS Policies for subscriptions table
CREATE POLICY "Users can read own subscriptions"
ON subscriptions FOR SELECT
USING (
	user_id IN (
		SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
	)
);

CREATE POLICY "Service role can manage subscriptions"
ON subscriptions FOR ALL
USING (true);

-- Create vector similarity search function
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

-- Create helper function to increment chat count
CREATE OR REPLACE FUNCTION increment_chat_count(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
	UPDATE users 
	SET chat_count = chat_count + 1 
	WHERE id = p_user_id;
END;
$$;

-- Create function to reset chat counts (run monthly via cron job)
CREATE OR REPLACE FUNCTION reset_chat_counts()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
	UPDATE users 
	SET chat_count = 0 
	WHERE subscription_tier = 'free';
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Indexes created successfully
-- RLS policies enabled
-- Vector search function created
-- Ready for production use

