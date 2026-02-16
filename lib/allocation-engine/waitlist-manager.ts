/**
 * Waitlist operations: add, remove, get next promotable patient.
 * Ordered by priority ASC, then joinedAt ASC (FIFO within same priority).
 * All methods are now async for Supabase store.
 */

import type { WaitlistEntry, TokenSource } from "@/lib/types";
import { getPriorityForSource } from "./priority-calculator";
import { store } from "@/lib/store";

/**
 * Get waitlist entries for a doctor, optionally filtered by preferred slot.
 * Sorted by priority ASC, joinedAt ASC.
 */
export async function getSortedWaitlist(
  doctorId: string,
  preferredSlotId: string | null
): Promise<WaitlistEntry[]> {
  const entries = await store.waitlist.getByDoctorAndSlot(doctorId, preferredSlotId);
  return entries
    .filter((e) => e.status === "waiting")
    .sort((a, b) => {
      const prio = a.priority - b.priority;
      if (prio !== 0) return prio;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });
}

/**
 * Get next patient to promote from waitlist for a given doctor/slot.
 * Returns null if waitlist empty.
 */
export async function getNextWaitlistPatient(
  doctorId: string,
  preferredSlotId: string | null
): Promise<WaitlistEntry | null> {
  const sorted = await getSortedWaitlist(doctorId, preferredSlotId);
  return sorted[0] ?? null;
}

/**
 * Mark waitlist entry as promoted (after token allocated).
 */
export async function markWaitlistPromoted(entryId: string): Promise<void> {
  const entry = await store.waitlist.getById(entryId);
  if (entry) {
    await store.waitlist.set({ ...entry, status: "promoted" });
  }
}

/**
 * Create a new waitlist entry with correct priority from token source.
 */
export async function createWaitlistEntry(params: {
  id: string;
  patientId: string;
  doctorId: string;
  preferredSlotId: string | null;
  tokenSource: TokenSource;
  patientDetails?: { name: string; phone: string; email?: string };
}): Promise<WaitlistEntry> {
  const priority = getPriorityForSource(params.tokenSource);
  const entry: WaitlistEntry = {
    id: params.id,
    patientId: params.patientId,
    doctorId: params.doctorId,
    preferredSlotId: params.preferredSlotId,
    tokenSource: params.tokenSource,
    priority,
    joinedAt: new Date().toISOString(),
    status: "waiting",
    patientDetails: params.patientDetails,
  };
  await store.waitlist.set(entry);
  return entry;
}
