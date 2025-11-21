/*
  # Fix Sentiment Constraint to Remove 'concerning'

  ## Changes
  
  1. Update sentiment CHECK constraint
    - Remove 'concerning' as a valid sentiment value
    - Keep only 'positive', 'neutral', and 'negative'
  
  2. Important Notes
    - Drops the existing constraint and recreates it
    - Safe to run multiple times (idempotent)
    - No data migration needed as 'concerning' should not have been used yet
*/

-- Drop the old sentiment constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stories_sentiment_check'
  ) THEN
    ALTER TABLE stories DROP CONSTRAINT stories_sentiment_check;
  END IF;
END $$;

-- Add updated sentiment constraint with only 'positive', 'neutral', 'negative'
ALTER TABLE stories ADD CONSTRAINT stories_sentiment_check 
  CHECK (sentiment IN ('positive', 'neutral', 'negative'));
