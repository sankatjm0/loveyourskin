-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read BOOLEAN DEFAULT FALSE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert
CREATE POLICY "Allow insert contact messages" ON contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only admins can read
CREATE POLICY "Admin read contact messages" ON contact_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_access
      WHERE admin_access.user_id = auth.uid()
      AND admin_access.is_admin = true
    )
  );
