/**
 * In-memory store for MedflowX prototype.
 * Can be replaced with PostgreSQL/Prisma for production.
 */

import type {
  Doctor,
  TimeSlot,
  Token,
  Patient,
  WaitlistEntry,
} from "@/lib/types";

/** In-memory collections - single source of truth */
const doctors = new Map<string, Doctor>();
const slots = new Map<string, TimeSlot>();
const tokens = new Map<string, Token>();
const patients = new Map<string, Patient>();
const waitlist = new Map<string, WaitlistEntry>();

/** Slot sequence counters per doctor-slot for token numbers (e.g. D1-S2-T05) */
const slotSequenceCounters = new Map<string, number>();

function getNextSequence(doctorId: string, slotId: string): number {
  const key = `${doctorId}-${slotId}`;
  const current = slotSequenceCounters.get(key) ?? 0;
  slotSequenceCounters.set(key, current + 1);
  return current + 1;
}

export const store = {
  doctors: {
    getAll: (): Doctor[] => Array.from(doctors.values()),
    getById: (id: string): Doctor | undefined => doctors.get(id),
    set: (d: Doctor) => {
      doctors.set(d.id, d);
      return d;
    },
    delete: (id: string) => doctors.delete(id),
  },

  slots: {
    getAll: (): TimeSlot[] => Array.from(slots.values()),
    getById: (id: string): TimeSlot | undefined => slots.get(id),
    getByDoctorAndDate: (doctorId: string, date: string): TimeSlot[] =>
      Array.from(slots.values()).filter(
        (s) => s.doctorId === doctorId && s.date === date
      ),
    set: (s: TimeSlot) => {
      slots.set(s.id, s);
      return s;
    },
    delete: (id: string) => slots.delete(id),
  },

  tokens: {
    getAll: (): Token[] => Array.from(tokens.values()),
    getById: (id: string): Token | undefined => tokens.get(id),
    getBySlot: (slotId: string): Token[] =>
      Array.from(tokens.values()).filter(
        (t) => t.slotId === slotId && !["cancelled", "no_show"].includes(t.status)
      ),
    getByPatient: (patientId: string): Token[] =>
      Array.from(tokens.values()).filter(
        (t) => t.patientId === patientId && !["cancelled", "no_show"].includes(t.status)
      ),
    set: (t: Token) => {
      tokens.set(t.id, t);
      return t;
    },
    delete: (id: string) => tokens.delete(id),
  },

  patients: {
    getAll: (): Patient[] => Array.from(patients.values()),
    getById: (id: string): Patient | undefined => patients.get(id),
    set: (p: Patient) => {
      patients.set(p.id, p);
      return p;
    },
    delete: (id: string) => patients.delete(id),
  },

  waitlist: {
    getAll: (): WaitlistEntry[] => Array.from(waitlist.values()),
    getById: (id: string): WaitlistEntry | undefined => waitlist.get(id),
    getByDoctor: (doctorId: string): WaitlistEntry[] =>
      Array.from(waitlist.values()).filter(
        (w) => w.doctorId === doctorId && w.status === "waiting"
      ),
    getByDoctorAndSlot: (doctorId: string, preferredSlotId: string | null): WaitlistEntry[] =>
      Array.from(waitlist.values()).filter(
        (w) =>
          w.doctorId === doctorId &&
          w.status === "waiting" &&
          (preferredSlotId == null || w.preferredSlotId === preferredSlotId)
      ),
    set: (w: WaitlistEntry) => {
      waitlist.set(w.id, w);
      return w;
    },
    delete: (id: string) => waitlist.delete(id),
  },

  /** Get next token sequence number for human-readable token number */
  getNextTokenSequence: (doctorId: string, slotId: string): number =>
    getNextSequence(doctorId, slotId),

  /** Reset store (for tests/simulation) */
  reset: () => {
    doctors.clear();
    slots.clear();
    tokens.clear();
    patients.clear();
    waitlist.clear();
    slotSequenceCounters.clear();
  },
};

export type Store = typeof store;
