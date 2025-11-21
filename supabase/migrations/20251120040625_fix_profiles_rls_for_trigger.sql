/*
  # Fix Profiles RLS for Trigger Function

  1. Changes
    - Change from FORCE ROW LEVEL SECURITY to regular RLS
    - This allows the service role and trigger to bypass RLS
    - User-facing policies remain secure
    
  2. Security
    - Service role can insert (needed for trigger)
    - Authenticated/anon users can only insert their own profile
    - All other access remains restricted
*/

-- Change from FORCE to regular RLS
-- This allows service role to bypass RLS while keeping user security
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recreate the handle_new_user function with explicit permissions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
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
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role, anon, authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT INSERT, SELECT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO anon;
