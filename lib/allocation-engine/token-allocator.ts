/**
 * Main token allocation logic: validate, check capacity, assign position, generate token.
 * Enforces hard slot limits; adds to waitlist when full.
 * All methods are now async for Supabase store.
 */

import { v4 as uuidv4 } from "uuid";
import type { Token, TimeSlot, TokenSource } from "@/lib/types";
import { getPriorityForSource } from "./priority-calculator";
import { getSortedWaitlist, createWaitlistEntry } from "./waitlist-manager";
import { store } from "@/lib/store";

const AVG_CONSULTATION_MINUTES = 6;

export interface AllocateResult {
  success: boolean;
  token?: Token;
  waitlistPosition?: number;
  message: string;
}

/**
 * Find slot by doctor and slot start time (ISO string match or same day + time).
 */
export async function findSlotForTime(
  doctorId: string,
  slotTime: string
): Promise<TimeSlot | undefined> {
  const date = slotTime.slice(0, 10);
  const slots = await store.slots.getByDoctorAndDate(doctorId, date);
  const target = new Date(slotTime).getTime();
  return slots.find((s) => {
    const start = new Date(s.startTime).getTime();
    const end = new Date(s.endTime).getTime();
    return target >= start && target < end;
  });
}

/**
 * Generate human-readable token number: D{doctorId}-S{slotSeq}-T{tokenSeq}
 */
export async function generateTokenNumber(
  doctorId: string,
  slotId: string,
  positionInSlot: number
): Promise<string> {
  const slot = await store.slots.getById(slotId);
  let slotSeq = 1;
  if (slot) {
    const allSlots = await store.slots.getByDoctorAndDate(slot.doctorId, slot.date);
    const sorted = allSlots.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    slotSeq = sorted.findIndex((s) => s.id === slotId) + 1;
  }
  const shortDoc = doctorId.replace(/-/g, "").slice(0, 2).toUpperCase() || "D1";
  return `${shortDoc}-S${slotSeq}-T${String(positionInSlot).padStart(2, "0")}`;
}

/**
 * Estimate consultation time for a position in slot.
 */
export function estimateConsultationTime(
  slot: TimeSlot,
  positionInQueue: number
): string {
  const slotStart = new Date(slot.actualStartTime || slot.startTime);
  const delayMs = (slot.estimatedDelay || 0) * 60 * 1000;
  const offsetMs =
    positionInQueue * AVG_CONSULTATION_MINUTES * 60 * 1000 + delayMs;
  return new Date(slotStart.getTime() + offsetMs).toISOString();
}

/**
 * Core allocation: validate request, check capacity, allocate or waitlist.
 */
export async function allocateToken(params: {
  patientId: string;
  doctorId: string;
  slotTime: string;
  tokenSource: TokenSource;
  patientDetails?: { name: string; phone: string; email?: string };
}): Promise<AllocateResult> {
  const doctor = await store.doctors.getById(params.doctorId);
  if (!doctor) {
    return { success: false, message: "Invalid doctor" };
  }

  const slot = await findSlotForTime(params.doctorId, params.slotTime);
  if (!slot) {
    return { success: false, message: "Invalid or not found slot for given time" };
  }

  if (slot.status === "cancelled") {
    return { success: false, message: "Slot is cancelled" };
  }

  // Duplicate booking check: same patient, same doctor, same day, active token
  const existingTokens = await store.tokens.getByPatient(params.patientId);
  const existing = existingTokens.filter(
    (t) =>
      t.doctorId === params.doctorId &&
      ["allocated", "waiting", "in_consultation"].includes(t.status)
  );
  if (existing.length > 0) {
    return {
      success: false,
      message: "Duplicate booking: patient already has an active token for this doctor",
    };
  }

  const priority = getPriorityForSource(params.tokenSource);
  const currentTokens = await store.tokens.getBySlot(slot.id);
  const occupancy = currentTokens.length;

  if (occupancy >= slot.maxCapacity) {
    // Add to waitlist
    const waitlistForSlot = await getSortedWaitlist(params.doctorId, slot.id);
    const entry = await createWaitlistEntry({
      id: uuidv4(),
      patientId: params.patientId,
      doctorId: params.doctorId,
      preferredSlotId: slot.id,
      tokenSource: params.tokenSource,
      patientDetails: params.patientDetails,
    });
    const position =
      waitlistForSlot.filter((w) => w.doctorId === params.doctorId && w.preferredSlotId === slot.id).length + 1;
    return {
      success: false,
      waitlistPosition: position,
      message: `Slot full. Added to waitlist at position ${position}. You will be notified if a slot opens.`,
    };
  }

  const positionInQueue = occupancy + 1;
  const tokenId = uuidv4();
  const tokenNumber = await generateTokenNumber(
    params.doctorId,
    slot.id,
    positionInQueue
  );
  const estimatedTime = estimateConsultationTime(slot, positionInQueue);

  const token: Token = {
    id: tokenId,
    tokenNumber,
    patientId: params.patientId,
    doctorId: params.doctorId,
    slotId: slot.id,
    tokenSource: params.tokenSource,
    priority,
    status: "allocated",
    allocatedAt: new Date().toISOString(),
    estimatedConsultationTime: estimatedTime,
    actualConsultationTime: null,
    completedAt: null,
    positionInQueue,
  };

  await store.tokens.set(token);
  await store.slots.set({
    ...slot,
    currentOccupancy: slot.currentOccupancy + 1,
  });

  return {
    success: true,
    token,
    message: `Token ${tokenNumber} allocated. Estimated time: ${estimatedTime}`,
  };
}
