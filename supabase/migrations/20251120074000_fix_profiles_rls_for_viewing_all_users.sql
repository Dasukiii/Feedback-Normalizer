/*
  # Fix Profiles RLS for Viewing All Users
  
  1. Changes
    - Add policy to allow admins and managers to view all profiles
    - This fixes the "Unknown User" issue in activity logs where manager names don't show up
    - Keeps the existing policy for regular users to view only their own profile
  
  2. Security
    - Admins can view all profiles
    - Managers can view all profiles (needed for assignment and audit logs)
    - Regular users can only view their own profile
*/

-- Add policy for admins and managers to view all profiles
CREATE POLICY "Admins and managers can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );
