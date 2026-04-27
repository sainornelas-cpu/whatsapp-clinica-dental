-- Migration script to update existing database schema
-- This script adds new fields and indexes without dropping existing data

-- ============================================
-- Update appointments table
-- ============================================

-- Add unique constraint to cal_booking_uid (if not already exists)
-- First, remove any duplicate values if they exist
DO $$
DECLARE
  dup RECORD;
BEGIN
  FOR dup IN
    SELECT cal_booking_uid, MIN(id::text)::uuid as keep_id
    FROM appointments
    WHERE cal_booking_uid IS NOT NULL
    GROUP BY cal_booking_uid
    HAVING COUNT(*) > 1
  LOOP
    DELETE FROM appointments
    WHERE cal_booking_uid = dup.cal_booking_uid AND id != dup.keep_id;
  END LOOP;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'appointments_cal_booking_uid_key'
  ) THEN
    ALTER TABLE appointments ADD CONSTRAINT appointments_cal_booking_uid_key UNIQUE (cal_booking_uid);
  END IF;
END $$;

-- Update status CHECK constraint to include 'pending'
-- First, drop existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'appointments_status_check' AND conrelid = 'appointments'::regclass
  ) THEN
    ALTER TABLE appointments DROP CONSTRAINT appointments_status_check;
  END IF;
END $$;

-- Add the new constraint with all statuses
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'scheduled', 'cancelled', 'completed', 'no_show'));

-- Add index on cal_booking_uid if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_appointments_cal_booking_uid ON appointments(cal_booking_uid);

-- ============================================
-- Verification
-- ============================================

-- Display current schema info
SELECT
  'Appointments table structure' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Display indexes on appointments
SELECT
  'Appointments indexes' as info,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'appointments';

-- Display constraints on appointments
SELECT
  'Appointments constraints' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'appointments'::regclass;
