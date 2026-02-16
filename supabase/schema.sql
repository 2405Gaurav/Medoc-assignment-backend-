-- =============================================================
-- MedflowX – Supabase Schema
-- Run this SQL in your Supabase SQL editor to create all tables.
-- =============================================================

-- Enum-like types ------------------------------------------------

DO $$ BEGIN
  CREATE TYPE token_source AS ENUM (
    'online_booking', 'walk_in', 'paid_priority', 'follow_up'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE token_status AS ENUM (
    'allocated', 'waiting', 'in_consultation', 'completed', 'cancelled', 'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE slot_status AS ENUM (
    'scheduled', 'active', 'completed', 'delayed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE waitlist_status AS ENUM (
    'waiting', 'promoted', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tables ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS doctors (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  specialization  TEXT NOT NULL,
  slot_duration   INTEGER NOT NULL DEFAULT 60,
  max_patients_per_slot INTEGER NOT NULL DEFAULT 10,
  working_hours_start TEXT NOT NULL DEFAULT '09:00',
  working_hours_end   TEXT NOT NULL DEFAULT '13:00',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  is_follow_up    BOOLEAN NOT NULL DEFAULT false,
  previous_visit  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS time_slots (
  id                  TEXT PRIMARY KEY,
  doctor_id           TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  date                TEXT NOT NULL,            -- YYYY-MM-DD
  start_time          TIMESTAMPTZ NOT NULL,
  end_time            TIMESTAMPTZ NOT NULL,
  max_capacity        INTEGER NOT NULL,
  current_occupancy   INTEGER NOT NULL DEFAULT 0,
  status              slot_status NOT NULL DEFAULT 'scheduled',
  actual_start_time   TIMESTAMPTZ,
  estimated_delay     INTEGER NOT NULL DEFAULT 0,  -- minutes
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tokens (
  id                          TEXT PRIMARY KEY,
  token_number                TEXT NOT NULL,
  patient_id                  TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id                   TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  slot_id                     TEXT NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  token_source                token_source NOT NULL,
  priority                    INTEGER NOT NULL,
  status                      token_status NOT NULL DEFAULT 'allocated',
  allocated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  estimated_consultation_time TIMESTAMPTZ NOT NULL,
  actual_consultation_time    TIMESTAMPTZ,
  completed_at                TIMESTAMPTZ,
  position_in_queue           INTEGER NOT NULL,
  is_emergency                BOOLEAN NOT NULL DEFAULT false,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS waitlist (
  id                TEXT PRIMARY KEY,
  patient_id        TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id         TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  preferred_slot_id TEXT REFERENCES time_slots(id) ON DELETE SET NULL,
  token_source      token_source NOT NULL,
  priority          INTEGER NOT NULL,
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  status            waitlist_status NOT NULL DEFAULT 'waiting',
  patient_name      TEXT,
  patient_phone     TEXT,
  patient_email     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Slot sequence counters for generating human-readable token numbers
CREATE TABLE IF NOT EXISTS slot_sequence_counters (
  doctor_id   TEXT NOT NULL,
  slot_id     TEXT NOT NULL,
  counter     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (doctor_id, slot_id)
);

-- Indexes --------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_time_slots_doctor_date ON time_slots(doctor_id, date);
CREATE INDEX IF NOT EXISTS idx_tokens_slot_status     ON tokens(slot_id, status);
CREATE INDEX IF NOT EXISTS idx_tokens_patient_status   ON tokens(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_waitlist_doctor_status   ON waitlist(doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_waitlist_slot_status     ON waitlist(preferred_slot_id, status);

-- Row Level Security (permissive – service role key bypasses) ----

ALTER TABLE doctors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens             ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist           ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_sequence_counters ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (these are no-op for service role key,
-- but helpful if anon/authenticated keys are used later).
CREATE POLICY "Service role full access" ON doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON time_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON waitlist FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON slot_sequence_counters FOR ALL USING (true) WITH CHECK (true);
