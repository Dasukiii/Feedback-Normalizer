/*
  # Fix Comments and Activity Log Schema

  1. Changes to activity_log table
    - Rename 'action' column to 'action_type'
    - Remove 'details' column
    - Add 'old_value', 'new_value', and 'description' columns

  2. Changes to comments table  
    - Rename 'text' column to 'content'
    - Add 'updated_at' column

  3. Important Notes
    - Uses safe ALTER TABLE commands
    - Preserves existing data where possible
*/

-- Fix activity_log table
DO $$
BEGIN
  -- Rename action to action_type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activity_log' AND column_name = 'action'
  ) THEN
    ALTER TABLE activity_log RENAME COLUMN action TO action_type;
  END IF;

  -- Add new columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activity_log' AND column_name = 'old_value'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN old_value text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activity_log' AND column_name = 'new_value'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN new_value text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activity_log' AND column_name = 'description'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN description text;
  END IF;

  -- Update description from details where description is null
  UPDATE activity_log 
  SET description = COALESCE(details::text, 'Activity logged')
  WHERE description IS NULL;

  -- Make description NOT NULL after populating
  ALTER TABLE activity_log ALTER COLUMN description SET NOT NULL;

  -- Drop details column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activity_log' AND column_name = 'details'
  ) THEN
    ALTER TABLE activity_log DROP COLUMN details;
  END IF;
END $$;

-- Fix comments table
DO $$
BEGIN
  -- Rename text to content
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'text'
  ) THEN
    ALTER TABLE comments RENAME COLUMN text TO content;
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE comments ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;
