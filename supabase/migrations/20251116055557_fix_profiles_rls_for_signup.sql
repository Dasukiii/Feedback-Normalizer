/*
  # Fix Profiles RLS for Signup

  This migration fixes the RLS policy issue that prevents profile creation during signup.

  ## Changes
  1. Drop existing INSERT policy
  2. Create new INSERT policy that allows both:
     - Authenticated users inserting their own profile
     - New users during signup (using anon role with matching auth.uid())

  ## Security Notes
  - The policy still ensures users can only insert their own profile
  - Uses auth.uid() to verify ownership even during signup
  - Maintains data integrity and security
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new INSERT policy that works during signup
-- This allows both authenticated users and users during signup process
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
