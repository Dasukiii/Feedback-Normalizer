/*
  # Create Feedback Normalizer Tables

  ## Overview
  Creates all core tables for the Feedback Normalizer application including
  requests, comments, activity logs, and notifications with proper RLS policies.

  ## New Tables

  ### 1. `requests` - Feedback requests table
  - `id` (uuid, primary key) - Unique request identifier
  - `user_id` (uuid) - References auth.users, creator of the request
  - `requester_name` (text, not null) - Name of person submitting feedback
  - `requester_email` (text) - Email of requester
  - `requester_department` (text) - Department of requester
  - `raw_feedback` (text, not null) - Original free-text input
  - `description` (text) - AI-extracted clean description
  - `category` (text) - AI-extracted: Policy/Complaint/Suggestion/etc
  - `priority` (text, default 'medium') - AI-extracted: high/medium/low
  - `status` (text, default 'new') - new/open/in-progress/resolved/closed
  - `source` (text, default 'manual') - email/slack/teams/manual
  - `owner_id` (uuid) - References auth.users, assigned to
  - `suggested_owner` (text) - AI suggestion before assignment
  - `due_date` (date) - Due date for request
  - `tags` (text[]) - AI-extracted tags array
  - `attachments` (jsonb) - File metadata
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `comments` - Comments/Notes on requests
  - `id` (uuid, primary key) - Unique comment identifier
  - `request_id` (uuid) - References requests, parent request
  - `user_id` (uuid) - References auth.users, comment author
  - `text` (text, not null) - Comment content
  - `is_internal` (boolean, default true) - Internal vs external
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. `activity_log` - Activity log (audit trail)
  - `id` (uuid, primary key) - Unique activity identifier
  - `user_id` (uuid) - References auth.users, user who performed action
  - `request_id` (uuid) - References requests, related request
  - `action` (text, not null) - Action type (created/assigned/status_changed/etc)
  - `details` (jsonb) - Additional context
  - `created_at` (timestamptz) - Creation timestamp

  ### 4. `notifications` - User notifications
  - `id` (uuid, primary key) - Unique notification identifier
  - `user_id` (uuid) - References auth.users, recipient
  - `request_id` (uuid) - References requests, related request
  - `type` (text, not null) - Notification type (assignment/mention/overdue/etc)
  - `message` (text, not null) - Notification message
  - `read` (boolean, default false) - Read status
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable RLS on all tables
  - Users can view all requests (organization-wide visibility)
  - Users can create requests as themselves
  - Users can update any request (for MVP, refine later)
  - Users can view and add comments
  - Users can view activity logs
  - Users can view and update only their own notifications
*/

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name text NOT NULL,
  requester_email text,
  requester_department text,
  raw_feedback text NOT NULL,
  description text,
  category text,
  priority text DEFAULT 'medium',
  status text DEFAULT 'new',
  source text DEFAULT 'manual',
  owner_id uuid REFERENCES auth.users(id),
  suggested_owner text,
  due_date date,
  tags text[],
  attachments jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  text text NOT NULL,
  is_internal boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  request_id uuid REFERENCES requests(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for requests table
CREATE POLICY "Users can view all requests"
  ON requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create requests"
  ON requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update requests"
  ON requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own requests"
  ON requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for comments table
CREATE POLICY "Users can view comments"
  ON comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for activity_log table
CREATE POLICY "Users can view activity"
  ON activity_log
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create activity logs"
  ON activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_owner_id ON requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_request_id ON comments(request_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_request_id ON activity_log(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);