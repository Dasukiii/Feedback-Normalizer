/*
  # Update Profiles Table for Feedback Normalizer

  ## Changes
  1. Updates existing profiles table to support new role types
  2. Roles are now: 'Admin' or 'Manager'
  3. No structural changes needed - just documentation update

  ## Notes
  - Existing role field will store 'Admin' or 'Manager'
  - Company name field already exists
  - All RLS policies already in place
  - Automatic profile creation trigger already configured
*/

-- No schema changes needed, just updating for new application context
-- The existing profiles table structure supports the Feedback Normalizer requirements