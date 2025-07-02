/*
  # Fix ticket_comments RLS policies for real-time notifications

  1. Security Updates
    - Add RLS policies for ticket_comments table to allow proper real-time subscriptions
    - Allow users to read their own comments
    - Allow users to read comments on their own tickets
    - Allow agents and admins to read all comments
    - Ensure get_user_role function exists for role-based access

  2. Changes
    - Enable RLS on ticket_comments if not already enabled
    - Add SELECT policies for different user roles
    - Create get_user_role function if it doesn't exist
*/

-- Ensure RLS is enabled on ticket_comments table
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Create get_user_role function if it doesn't exist
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_uuid;
  
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow own comments read" ON ticket_comments;
DROP POLICY IF EXISTS "Allow comments on own tickets read" ON ticket_comments;
DROP POLICY IF EXISTS "Allow agents/admins all comments read" ON ticket_comments;

-- Policy 1: Allow authenticated users to read their own comments
CREATE POLICY "Allow own comments read"
  ON ticket_comments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Allow authenticated users to read comments on their own tickets
CREATE POLICY "Allow comments on own tickets read"
  ON ticket_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets 
      WHERE id = ticket_comments.ticket_id 
      AND customer_id = auth.uid()
    )
  );

-- Policy 3: Allow agents and administrators to read all comments
CREATE POLICY "Allow agents/admins all comments read"
  ON ticket_comments
  FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'agent'));

-- Also ensure agents/admins can read comments on tickets assigned to them
CREATE POLICY "Allow assigned agent comments read"
  ON ticket_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets 
      WHERE id = ticket_comments.ticket_id 
      AND assignee_id = auth.uid()
    )
  );