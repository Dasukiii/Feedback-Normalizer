/*
  # Add Foreign Keys and Fix Requests RLS Policies
  
  1. Changes
    - Add foreign key constraints for user_id and owner_id in requests table
    - Update RLS policies to use the security definer function to avoid recursion
  
  2. Foreign Keys
    - requests.user_id references profiles(id)
    - requests.owner_id references profiles(id)
  
  3. Security
    - Use get_current_user_role() function to avoid recursion
    - Maintain same access control logic
*/

-- Add foreign key constraints for requests table
ALTER TABLE requests
  DROP CONSTRAINT IF EXISTS requests_user_id_fkey;

ALTER TABLE requests
  ADD CONSTRAINT requests_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

ALTER TABLE requests
  DROP CONSTRAINT IF EXISTS requests_owner_id_fkey;

ALTER TABLE requests
  ADD CONSTRAINT requests_owner_id_fkey
  FOREIGN KEY (owner_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Role-based request visibility" ON requests;
DROP POLICY IF EXISTS "Role-based request updates" ON requests;
DROP POLICY IF EXISTS "Role-based request deletion" ON requests;

-- Create new RLS policies using the security definer function
CREATE POLICY "Role-based request visibility"
  ON requests
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'admin' OR
    (get_current_user_role() = 'manager' AND (user_id = auth.uid() OR owner_id = auth.uid())) OR
    (get_current_user_role() NOT IN ('admin', 'manager'))
  );

CREATE POLICY "Role-based request updates"
  ON requests
  FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'admin' OR
    (get_current_user_role() = 'manager' AND (user_id = auth.uid() OR owner_id = auth.uid())) OR
    (get_current_user_role() NOT IN ('admin', 'manager'))
  )
  WITH CHECK (
    get_current_user_role() = 'admin' OR
    (get_current_user_role() = 'manager' AND (user_id = auth.uid() OR owner_id = auth.uid())) OR
    (get_current_user_role() NOT IN ('admin', 'manager'))
  );

CREATE POLICY "Role-based request deletion"
  ON requests
  FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() = 'admin' OR
    (get_current_user_role() = 'manager' AND user_id = auth.uid()) OR
    (get_current_user_role() NOT IN ('admin', 'manager') AND user_id = auth.uid())
  );
