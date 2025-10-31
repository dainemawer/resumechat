-- Add is_public field to resumes table
-- This field controls whether a resume is publicly accessible via share link

ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true NOT NULL;

-- Create index for faster lookups on public resumes with slugs
CREATE INDEX IF NOT EXISTS idx_resumes_share_slug_public ON resumes(share_slug) WHERE is_public = true;

-- Add comment for documentation
COMMENT ON COLUMN resumes.is_public IS 'Controls whether the resume is publicly accessible via share link';

