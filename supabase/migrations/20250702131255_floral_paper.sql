/*
  # Fix ticket_comments RLS policies for real-time notifications

  1. Security Changes
    - Enable RLS on ticket_comments table
    - Add comprehensive SELECT policies for different user roles
    - Allow users to read their own comments
    - Allow users to read comments on tickets they created
    - Allow agents/admins to read all comments
    - Allow assigned agents to read comments on their tickets

  2. Functions
    - Drop and recreate get_user_role function with correct return type
*/

-- Ensure RLS is enabled on ticket_comments table
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing get_user_role function if it exists to avoid type conflicts
DROP FUNCTION IF EXISTS get_user_role(uuid);

-- Create get_user_role function with correct return type
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM profiles
  WHERE id = user_uuid;
  
  RETURN COALESCE(user_role_result, 'user'::user_role);
END;
$$;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow own comments read" ON ticket_comments;
DROP POLICY IF EXISTS "Allow comments on own tickets read" ON ticket_comments;
DROP POLICY IF EXISTS "Allow agents/admins all comments read" ON ticket_comments;
DROP POLICY IF EXISTS "Allow assigned agent comments read" ON ticket_comments;

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

-- Policy 4: Allow assigned agents to read comments on tickets assigned to them
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