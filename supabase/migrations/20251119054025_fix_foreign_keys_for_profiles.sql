/*
  # Fix Foreign Key Relationships for Profiles

  1. Changes
    - Drop existing foreign keys on comments.user_id and activity_log.user_id (pointing to auth.users)
    - Add new foreign keys pointing to profiles.id instead
    - This allows Supabase PostgREST to properly join with profiles table

  2. Important Notes
    - profiles.id should match auth.users.id (1-to-1 relationship)
    - This enables the query syntax: profiles:user_id (id, name, email)
*/

-- Drop and recreate foreign key for comments.user_id
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'comments_user_id_fkey' 
    AND table_name = 'comments'
  ) THEN
    ALTER TABLE comments DROP CONSTRAINT comments_user_id_fkey;
  END IF;

  -- Add new constraint pointing to profiles
  ALTER TABLE comments 
    ADD CONSTRAINT comments_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;
END $$;

-- Drop and recreate foreign key for activity_log.user_id
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'activity_log_user_id_fkey' 
    AND table_name = 'activity_log'
  ) THEN
    ALTER TABLE activity_log DROP CONSTRAINT activity_log_user_id_fkey;
  END IF;

  -- Add new constraint pointing to profiles
  -- Note: This is nullable, so we use ON DELETE SET NULL
  ALTER TABLE activity_log 
    ADD CONSTRAINT activity_log_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE SET NULL;
END $$;
