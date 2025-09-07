import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function createTables() {
  // Users table
  await supabase.rpc('sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name text NOT NULL,
        email text UNIQUE NOT NULL,
        password text NOT NULL,
        college_id uuid,
        role text DEFAULT 'student',
        created_at timestamp with time zone DEFAULT now()
      );
    `
  });

  // Events table
  await supabase.rpc('sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text,
        event_type text,
        start_time timestamp with time zone,
        end_time timestamp with time zone,
        college_id uuid,
        created_at timestamp with time zone DEFAULT now()
      );
    `
  });

  // Registrations table
  await supabase.rpc('sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS registrations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id),
        event_id uuid REFERENCES events(id),
        created_at timestamp with time zone DEFAULT now()
      );
    `
  });

  // Attendance table
  await supabase.rpc('sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS attendance (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        registration_id uuid REFERENCES registrations(id),
        present boolean DEFAULT false,
        created_at timestamp with time zone DEFAULT now()
      );
    `
  });

  console.log("All tables created successfully!");
}

createTables().catch(console.error);
