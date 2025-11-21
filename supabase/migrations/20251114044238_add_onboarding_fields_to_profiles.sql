/*
  # Add Onboarding Fields to Profiles Table

  1. Changes
    - Add `organization_size` field to store user's organization size selection
    - Add `primary_challenge` field to store user's main engagement challenge
    - Add `action_plan_preference` field to store preferred action plan type
    - Add `onboarding_completed` boolean to track if user finished onboarding
    - Add `onboarding_completed_at` timestamp to track when onboarding was finished

  2. Notes
    - Fields are nullable to allow existing users to continue without onboarding
    - New users will have onboarding_completed default to false
    - Onboarding data helps AI generate better recommendations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'organization_size'
  ) THEN
    ALTER TABLE profiles ADD COLUMN organization_size text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'primary_challenge'
  ) THEN
    ALTER TABLE profiles ADD COLUMN primary_challenge text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'action_plan_preference'
  ) THEN
    ALTER TABLE profiles ADD COLUMN action_plan_preference text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed_at timestamptz;
  END IF;
END $$;
