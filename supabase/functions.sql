-- Atomic slot sequence increment function
-- Run this in the Supabase SQL editor after the schema.sql

CREATE OR REPLACE FUNCTION increment_slot_sequence(
  p_doctor_id TEXT,
  p_slot_id   TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_next INTEGER;
BEGIN
  INSERT INTO slot_sequence_counters (doctor_id, slot_id, counter)
  VALUES (p_doctor_id, p_slot_id, 1)
  ON CONFLICT (doctor_id, slot_id)
  DO UPDATE SET counter = slot_sequence_counters.counter + 1
  RETURNING counter INTO v_next;

  RETURN v_next;
END;
$$;
