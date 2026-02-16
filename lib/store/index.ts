/**
 * Supabase-backed store for MedflowX.
 * Provides async CRUD helpers that mirror the old in-memory store interface
 * but persist data in Supabase / PostgreSQL.
 *
 * Every public method is async and works with the application-level camelCase types.
 * Internally we map to/from the snake_case DB columns.
 */

import { supabase } from "@/lib/db/supabase";
import type {
  Doctor,
  TimeSlot,
  Token,
  Patient,
  WaitlistEntry,
  TokenSource,
  TokenStatus,
  SlotStatus,
  WaitlistStatus,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Row ↔ Model mappers                                               */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDoctor(r: any): Doctor {
  return {
    id: r.id,
    name: r.name,
    specialization: r.specialization,
    slotDuration: r.slot_duration,
    maxPatientsPerSlot: r.max_patients_per_slot,
    workingHours: { start: r.working_hours_start, end: r.working_hours_end },
  };
}

function doctorToRow(d: Doctor) {
  return {
    id: d.id,
    name: d.name,
    specialization: d.specialization,
    slot_duration: d.slotDuration,
    max_patients_per_slot: d.maxPatientsPerSlot,
    working_hours_start: d.workingHours.start,
    working_hours_end: d.workingHours.end,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSlot(r: any): TimeSlot {
  return {
    id: r.id,
    doctorId: r.doctor_id,
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    maxCapacity: r.max_capacity,
    currentOccupancy: r.current_occupancy,
    status: r.status as SlotStatus,
    actualStartTime: r.actual_start_time ?? null,
    estimatedDelay: r.estimated_delay,
  };
}

function slotToRow(s: TimeSlot) {
  return {
    id: s.id,
    doctor_id: s.doctorId,
    date: s.date,
    start_time: s.startTime,
    end_time: s.endTime,
    max_capacity: s.maxCapacity,
    current_occupancy: s.currentOccupancy,
    status: s.status,
    actual_start_time: s.actualStartTime,
    estimated_delay: s.estimatedDelay,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToToken(r: any): Token {
  return {
    id: r.id,
    tokenNumber: r.token_number,
    patientId: r.patient_id,
    doctorId: r.doctor_id,
    slotId: r.slot_id,
    tokenSource: r.token_source as TokenSource,
    priority: r.priority,
    status: r.status as TokenStatus,
    allocatedAt: r.allocated_at,
    estimatedConsultationTime: r.estimated_consultation_time,
    actualConsultationTime: r.actual_consultation_time ?? null,
    completedAt: r.completed_at ?? null,
    positionInQueue: r.position_in_queue,
    isEmergency: r.is_emergency ?? false,
  };
}

function tokenToRow(t: Token) {
  return {
    id: t.id,
    token_number: t.tokenNumber,
    patient_id: t.patientId,
    doctor_id: t.doctorId,
    slot_id: t.slotId,
    token_source: t.tokenSource,
    priority: t.priority,
    status: t.status,
    allocated_at: t.allocatedAt,
    estimated_consultation_time: t.estimatedConsultationTime,
    actual_consultation_time: t.actualConsultationTime,
    completed_at: t.completedAt,
    position_in_queue: t.positionInQueue,
    is_emergency: t.isEmergency ?? false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPatient(r: any): Patient {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email ?? null,
    isFollowUp: r.is_follow_up,
    previousVisit: r.previous_visit ?? null,
  };
}

function patientToRow(p: Patient) {
  return {
    id: p.id,
    name: p.name,
    phone: p.phone,
    email: p.email,
    is_follow_up: p.isFollowUp,
    previous_visit: p.previousVisit,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToWaitlist(r: any): WaitlistEntry {
  return {
    id: r.id,
    patientId: r.patient_id,
    doctorId: r.doctor_id,
    preferredSlotId: r.preferred_slot_id ?? null,
    tokenSource: r.token_source as TokenSource,
    priority: r.priority,
    joinedAt: r.joined_at,
    status: r.status as WaitlistStatus,
    patientDetails:
      r.patient_name || r.patient_phone
        ? { name: r.patient_name ?? "", phone: r.patient_phone ?? "", email: r.patient_email ?? undefined }
        : undefined,
  };
}

function waitlistToRow(w: WaitlistEntry) {
  return {
    id: w.id,
    patient_id: w.patientId,
    doctor_id: w.doctorId,
    preferred_slot_id: w.preferredSlotId,
    token_source: w.tokenSource,
    priority: w.priority,
    joined_at: w.joinedAt,
    status: w.status,
    patient_name: w.patientDetails?.name ?? null,
    patient_phone: w.patientDetails?.phone ?? null,
    patient_email: w.patientDetails?.email ?? null,
  };
}

/* ------------------------------------------------------------------ */
/*  Generic helpers                                                   */
/* ------------------------------------------------------------------ */

function throwOnError<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}

/* ------------------------------------------------------------------ */
/*  Exported async store                                              */
/* ------------------------------------------------------------------ */

export const store = {
  /* ---- Doctors --------------------------------------------------- */
  doctors: {
    getAll: async (): Promise<Doctor[]> => {
      const { data, error } = await supabase.from("doctors").select("*");
      if (error) throw error;
      return (data ?? []).map(rowToDoctor);
    },
    getById: async (id: string): Promise<Doctor | undefined> => {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToDoctor(data) : undefined;
    },
    set: async (d: Doctor): Promise<Doctor> => {
      const { error } = await supabase
        .from("doctors")
        .upsert(doctorToRow(d), { onConflict: "id" });
      if (error) throw error;
      return d;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("doctors").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
  },

  /* ---- Time Slots ------------------------------------------------ */
  slots: {
    getAll: async (): Promise<TimeSlot[]> => {
      const { data, error } = await supabase.from("time_slots").select("*");
      if (error) throw error;
      return (data ?? []).map(rowToSlot);
    },
    getById: async (id: string): Promise<TimeSlot | undefined> => {
      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToSlot(data) : undefined;
    },
    getByDoctorAndDate: async (
      doctorId: string,
      date: string
    ): Promise<TimeSlot[]> => {
      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .eq("doctor_id", doctorId)
        .eq("date", date);
      if (error) throw error;
      return (data ?? []).map(rowToSlot);
    },
    set: async (s: TimeSlot): Promise<TimeSlot> => {
      const { error } = await supabase
        .from("time_slots")
        .upsert(slotToRow(s), { onConflict: "id" });
      if (error) throw error;
      return s;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase
        .from("time_slots")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return true;
    },
  },

  /* ---- Tokens ---------------------------------------------------- */
  tokens: {
    getAll: async (): Promise<Token[]> => {
      const { data, error } = await supabase.from("tokens").select("*");
      if (error) throw error;
      return (data ?? []).map(rowToToken);
    },
    getById: async (id: string): Promise<Token | undefined> => {
      const { data, error } = await supabase
        .from("tokens")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToToken(data) : undefined;
    },
    getBySlot: async (slotId: string): Promise<Token[]> => {
      const { data, error } = await supabase
        .from("tokens")
        .select("*")
        .eq("slot_id", slotId)
        .not("status", "in", '("cancelled","no_show")');
      if (error) throw error;
      return (data ?? []).map(rowToToken);
    },
    getByPatient: async (patientId: string): Promise<Token[]> => {
      const { data, error } = await supabase
        .from("tokens")
        .select("*")
        .eq("patient_id", patientId)
        .not("status", "in", '("cancelled","no_show")');
      if (error) throw error;
      return (data ?? []).map(rowToToken);
    },
    set: async (t: Token): Promise<Token> => {
      const { error } = await supabase
        .from("tokens")
        .upsert(tokenToRow(t), { onConflict: "id" });
      if (error) throw error;
      return t;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("tokens").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
  },

  /* ---- Patients -------------------------------------------------- */
  patients: {
    getAll: async (): Promise<Patient[]> => {
      const { data, error } = await supabase.from("patients").select("*");
      if (error) throw error;
      return (data ?? []).map(rowToPatient);
    },
    getById: async (id: string): Promise<Patient | undefined> => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToPatient(data) : undefined;
    },
    set: async (p: Patient): Promise<Patient> => {
      const { error } = await supabase
        .from("patients")
        .upsert(patientToRow(p), { onConflict: "id" });
      if (error) throw error;
      return p;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
  },

  /* ---- Waitlist -------------------------------------------------- */
  waitlist: {
    getAll: async (): Promise<WaitlistEntry[]> => {
      const { data, error } = await supabase.from("waitlist").select("*");
      if (error) throw error;
      return (data ?? []).map(rowToWaitlist);
    },
    getById: async (id: string): Promise<WaitlistEntry | undefined> => {
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToWaitlist(data) : undefined;
    },
    getByDoctor: async (doctorId: string): Promise<WaitlistEntry[]> => {
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .eq("doctor_id", doctorId)
        .eq("status", "waiting");
      if (error) throw error;
      return (data ?? []).map(rowToWaitlist);
    },
    getByDoctorAndSlot: async (
      doctorId: string,
      preferredSlotId: string | null
    ): Promise<WaitlistEntry[]> => {
      let query = supabase
        .from("waitlist")
        .select("*")
        .eq("doctor_id", doctorId)
        .eq("status", "waiting");

      if (preferredSlotId != null) {
        query = query.eq("preferred_slot_id", preferredSlotId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(rowToWaitlist);
    },
    set: async (w: WaitlistEntry): Promise<WaitlistEntry> => {
      const { error } = await supabase
        .from("waitlist")
        .upsert(waitlistToRow(w), { onConflict: "id" });
      if (error) throw error;
      return w;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("waitlist").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
  },

  /* ---- Token sequence counter ------------------------------------ */
  getNextTokenSequence: async (
    doctorId: string,
    slotId: string
  ): Promise<number> => {
    // Atomic increment via upsert + returning
    const { data, error } = await supabase.rpc("increment_slot_sequence", {
      p_doctor_id: doctorId,
      p_slot_id: slotId,
    });
    if (error) {
      // Fallback: manual upsert
      const { data: existing } = await supabase
        .from("slot_sequence_counters")
        .select("counter")
        .eq("doctor_id", doctorId)
        .eq("slot_id", slotId)
        .maybeSingle();

      const next = (existing?.counter ?? 0) + 1;
      await supabase.from("slot_sequence_counters").upsert(
        { doctor_id: doctorId, slot_id: slotId, counter: next },
        { onConflict: "doctor_id,slot_id" }
      );
      return next;
    }
    return data as number;
  },

  /* ---- Reset (for tests/simulation) ------------------------------ */
  reset: async (): Promise<void> => {
    // Order matters due to FK constraints
    await supabase.from("waitlist").delete().neq("id", "");
    await supabase.from("tokens").delete().neq("id", "");
    await supabase.from("time_slots").delete().neq("id", "");
    await supabase.from("patients").delete().neq("id", "");
    await supabase.from("doctors").delete().neq("id", "");
    await supabase.from("slot_sequence_counters").delete().neq("doctor_id", "");
  },
};

export type Store = typeof store;
