-- ============================================
-- Step 1: Drop existing objects (if any)
-- ============================================

-- Drop indexes first
DROP INDEX IF EXISTS idx_appointments_phone_number;
DROP INDEX IF EXISTS idx_appointments_status;
DROP INDEX IF EXISTS idx_appointments_date;
DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_conversations_phone_number;
DROP INDEX IF EXISTS idx_patients_phone_number;

-- Drop policies
DROP POLICY IF EXISTS "Service role full access" ON patients;
DROP POLICY IF EXISTS "Auth users read patients" ON patients;
DROP POLICY IF EXISTS "Service role full access" ON appointments;
DROP POLICY IF EXISTS "Auth users read appointments" ON appointments;
DROP POLICY IF EXISTS "Service role full access" ON conversations;
DROP POLICY IF EXISTS "Auth users read conversations" ON conversations;
DROP POLICY IF EXISTS "Service role full access" ON messages;
DROP POLICY IF EXISTS "Auth users read messages" ON messages;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- ============================================
-- Step 2: Create tables
-- ============================================

-- Patients (one record per phone number)
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  date_of_birth DATE,
  allergies TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Appointments
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  cal_booking_uid TEXT,
  service_type TEXT NOT NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed', 'no_show')),
  reminder_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations (one per patient/phone)
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Step 3: Create indexes
-- ============================================

CREATE INDEX idx_appointments_phone_number ON appointments(phone_number);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_conversations_phone_number ON conversations(phone_number);
CREATE INDEX idx_patients_phone_number ON patients(phone_number);

-- ============================================
-- Step 4: Enable Row Level Security
-- ============================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 5: Create RLS policies
-- ============================================

-- Patients policies
CREATE POLICY "Service role full access to patients" ON patients FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Authenticated users can read patients" ON patients FOR SELECT USING (auth.role() = 'authenticated');

-- Appointments policies
CREATE POLICY "Service role full access to appointments" ON appointments FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Authenticated users can read appointments" ON appointments FOR SELECT USING (auth.role() = 'authenticated');

-- Conversations policies
CREATE POLICY "Service role full access to conversations" ON conversations FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Authenticated users can read conversations" ON conversations FOR SELECT USING (auth.role() = 'authenticated');

-- Messages policies
CREATE POLICY "Service role full access to messages" ON messages FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Authenticated users can read messages" ON messages FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- Step 6: Enable Realtime
-- ============================================

-- Note: supabase_realtime publication should already exist
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
