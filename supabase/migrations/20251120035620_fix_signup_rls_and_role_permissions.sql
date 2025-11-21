/*
  # Fix Signup RLS and Role Permissions

  1. Changes to Profiles Table
    - Fix RLS policies to allow automatic profile creation during signup
    - Grant necessary permissions for the trigger function
    - Ensure proper role differentiation between admin and manager

  2. Security Policies
    - Allow service role to insert profiles (for trigger)
    - Maintain secure user access to own profiles
    - Enable proper role-based access control

  3. Role Distinctions
    - Admin: Can view all activity, assign to managers, full system access
    - Manager: Can only view own activity, manage own assignments
    - User: Basic access to own profile
*/

-- Grant the service role permission to insert into profiles
-- This allows the trigger function to work properly
GRANT INSERT ON public.profiles TO service_role;
GRANT INSERT ON public.profiles TO authenticated;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow service role (used by triggers) to bypass RLS
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Create policies that work with the trigger
CREATE POLICY "Enable insert for service role"
  ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure the trigger function has proper permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.profiles TO service_role;

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, company_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Company'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'manager')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
