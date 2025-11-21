/*
  # Fix Profiles RLS Infinite Recursion
  
  1. Changes
    - Drop the problematic policy that causes infinite recursion
    - Create a function to get user role that uses a security definer function
    - Add new policies that use the function to avoid recursion
  
  2. Security
    - Admins can view all profiles
    - Managers can view all profiles (needed for assignment and audit logs)
    - Regular users can only view their own profile
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON profiles;

-- Create a security definer function to get the current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN user_role;
END;
$$;

-- Create a new policy for admins and managers to view all profiles
CREATE POLICY "Admins and managers can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'manager')
  );
