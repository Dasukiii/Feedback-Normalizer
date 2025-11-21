/*
  # Add Automatic Profile Creation on User Signup

  This migration creates a database function and trigger that automatically
  creates a profile when a new user signs up, regardless of email confirmation status.

  ## Changes
  1. Create a function to handle profile creation
  2. Create a trigger that fires after user creation
  3. The function extracts user metadata and creates the profile

  ## Security Notes
  - Function runs with SECURITY DEFINER to bypass RLS
  - Only creates profile if it doesn't exist (prevents duplicates)
  - Uses user metadata passed during signup
*/

-- Create a function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, company_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Company'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
