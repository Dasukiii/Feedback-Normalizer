/*
  # Fix Comments and Activity Log RLS for Role-Based Access

  1. Changes
    - Update comments SELECT policy to align with role-based request visibility
    - Update activity_log SELECT policy to align with role-based request visibility
    - Ensure managers can view comments/activity for requests they can access
    
  2. Security
    - Comments and activity logs follow the same visibility rules as requests
    - Admins: see all
    - Managers: see only for their created or assigned requests
    - Regular users: see all
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view comments for requests they can access" ON comments;
DROP POLICY IF EXISTS "Users can view activity log for requests they can access" ON activity_log;

-- Create new role-based policy for viewing comments
CREATE POLICY "Role-based comment visibility"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all comments
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'admin'
    OR
    -- Managers can see comments for requests they created OR are assigned to
    (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
      AND EXISTS (
        SELECT 1 FROM requests r
        WHERE r.id = comments.request_id
        AND (r.user_id = auth.uid() OR r.owner_id = auth.uid())
      )
    )
    OR
    -- Regular users can see all comments
    (
      (SELECT role FROM profiles WHERE id = auth.uid()) NOT IN ('admin', 'manager')
    )
  );

-- Create new role-based policy for viewing activity log
CREATE POLICY "Role-based activity log visibility"
  ON activity_log
  FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all activity
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'admin'
    OR
    -- Managers can see activity for requests they created OR are assigned to
    (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
      AND EXISTS (
        SELECT 1 FROM requests r
        WHERE r.id = activity_log.request_id
        AND (r.user_id = auth.uid() OR r.owner_id = auth.uid())
      )
    )
    OR
    -- Regular users can see all activity
    (
      (SELECT role FROM profiles WHERE id = auth.uid()) NOT IN ('admin', 'manager')
    )
  );

-- Update comments INSERT policy to allow commenting on accessible requests
DROP POLICY IF EXISTS "Users can create comments" ON comments;

CREATE POLICY "Users can create comments on accessible requests"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Admins can comment on all requests
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      OR
      -- Managers can comment on their created or assigned requests
      (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
        AND EXISTS (
          SELECT 1 FROM requests r
          WHERE r.id = comments.request_id
          AND (r.user_id = auth.uid() OR r.owner_id = auth.uid())
        )
      )
      OR
      -- Regular users can comment on all requests
      (SELECT role FROM profiles WHERE id = auth.uid()) NOT IN ('admin', 'manager')
    )
  );
