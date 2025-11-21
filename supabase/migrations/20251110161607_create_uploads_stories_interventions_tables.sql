/*
  # Create Survey Data Management Tables

  1. New Tables
    
    ## uploads table
    - `id` (uuid, primary key) - Unique upload identifier
    - `user_id` (uuid, foreign key) - References profiles(id)
    - `file_name` (text, not null) - Original file name
    - `upload_date` (timestamptz, default now) - Upload timestamp
    - `total_responses` (integer, default 0) - Total survey responses
    - `avg_score` (numeric) - Average eNPS score
    - `status` (text, default 'uploaded') - Processing status: uploaded, validated, processed
    - `raw_data` (jsonb) - Survey response data
    - `created_at` (timestamptz, default now)
    - `updated_at` (timestamptz, default now)

    ## stories table
    - `id` (uuid, primary key) - Unique story identifier
    - `user_id` (uuid, foreign key) - References profiles(id)
    - `upload_id` (uuid, foreign key) - References uploads(id)
    - `team_name` (text, not null) - Team name
    - `enps_score` (numeric) - Team eNPS score
    - `narrative` (text) - AI-generated story narrative
    - `sentiment` (text) - Sentiment: positive, neutral, negative
    - `key_themes` (jsonb) - Array of key themes
    - `quotes` (jsonb) - Array of notable quotes
    - `generated_at` (timestamptz, default now)
    - `created_at` (timestamptz, default now)
    - `updated_at` (timestamptz, default now)

    ## interventions table
    - `id` (uuid, primary key) - Unique intervention identifier
    - `user_id` (uuid, foreign key) - References profiles(id)
    - `story_id` (uuid, foreign key) - References stories(id)
    - `team_name` (text, not null) - Team name
    - `title` (text, not null) - Intervention title
    - `description` (text) - Detailed description
    - `priority` (text, default 'medium') - Priority: high, medium, low
    - `effort` (integer) - Effort level 1-5
    - `impact` (text) - Expected impact description
    - `action_items` (jsonb) - Array of action items
    - `created_at` (timestamptz, default now)
    - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Policies for SELECT, INSERT, UPDATE, DELETE operations

  3. Important Notes
    - All tables link to user_id for data isolation
    - JSONB used for flexible array/object storage
    - Cascading deletes ensure data consistency
    - Status tracking for upload processing workflow
*/

-- Create uploads table
CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  upload_date timestamptz DEFAULT now(),
  total_responses integer DEFAULT 0,
  avg_score numeric,
  status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'validated', 'processed')),
  raw_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  upload_id uuid NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  enps_score numeric,
  narrative text,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  key_themes jsonb DEFAULT '[]'::jsonb,
  quotes jsonb DEFAULT '[]'::jsonb,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create interventions table
CREATE TABLE IF NOT EXISTS interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  effort integer CHECK (effort >= 1 AND effort <= 5),
  impact text,
  action_items jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for uploads table
CREATE POLICY "Users can view own uploads"
  ON uploads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads"
  ON uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads"
  ON uploads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploads"
  ON uploads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for stories table
CREATE POLICY "Users can view own stories"
  ON stories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stories"
  ON stories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories"
  ON stories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON stories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for interventions table
CREATE POLICY "Users can view own interventions"
  ON interventions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interventions"
  ON interventions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interventions"
  ON interventions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interventions"
  ON interventions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_upload_date ON uploads(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_upload_id ON stories(upload_id);
CREATE INDEX IF NOT EXISTS idx_interventions_user_id ON interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_story_id ON interventions(story_id);