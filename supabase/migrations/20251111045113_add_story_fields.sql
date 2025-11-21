/*
  # Add Additional Fields to Stories Table

  1. Changes
    - Add `promoters_pct` (numeric) - Percentage of promoters (9-10 scores)
    - Add `passives_pct` (numeric) - Percentage of passives (7-8 scores)
    - Add `detractors_pct` (numeric) - Percentage of detractors (0-6 scores)
    - Add `strengths` (jsonb) - Array of identified strengths
    - Add `concerns` (jsonb) - Array of identified concerns

  2. Important Notes
    - These fields support enhanced AI-generated story insights
    - Percentage fields provide detailed eNPS breakdown
    - Strengths and concerns enable targeted interventions
    - JSONB allows flexible array storage
*/

-- Add new columns to stories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'promoters_pct'
  ) THEN
    ALTER TABLE stories ADD COLUMN promoters_pct numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'passives_pct'
  ) THEN
    ALTER TABLE stories ADD COLUMN passives_pct numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'detractors_pct'
  ) THEN
    ALTER TABLE stories ADD COLUMN detractors_pct numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'strengths'
  ) THEN
    ALTER TABLE stories ADD COLUMN strengths jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'concerns'
  ) THEN
    ALTER TABLE stories ADD COLUMN concerns jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
