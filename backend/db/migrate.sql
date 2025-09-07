-- Enable extension for UUIDs & crypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- colleges
CREATE TABLE IF NOT EXISTS colleges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- users (students and admins)
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student','admin')),
  college_id uuid REFERENCES colleges(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- events
CREATE TABLE IF NOT EXISTS events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  college_id uuid REFERENCES colleges(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type text NOT NULL,
  location text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  capacity integer DEFAULT 0,
  created_by uuid REFERENCES users(id),
  is_cancelled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- registrations
CREATE TABLE IF NOT EXISTS registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  registered_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- attendance
CREATE TABLE IF NOT EXISTS attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id uuid REFERENCES registrations(id) ON DELETE CASCADE,
  present boolean DEFAULT false,
  checked_in_at timestamptz,
  marked_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- feedback
CREATE TABLE IF NOT EXISTS feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  comment text,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_events_college ON events(college_id);
CREATE INDEX IF NOT EXISTS idx_regs_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_reg ON attendance(registration_id);
CREATE INDEX IF NOT EXISTS idx_feedback_event ON feedback(event_id);
