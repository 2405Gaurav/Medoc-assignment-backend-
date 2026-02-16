/**
 * Emergency insertion: insert patient with highest priority (0).
 * May bump lowest-priority token in slot to next available slot or waitlist.
 * All methods are now async for Supabase store.
 */

import { v4 as uuidv4 } from "uuid";
import type { Token, TimeSlot } from "@/lib/types";
import { EMERGENCY_PRIORITY } from "./priority-calculator";
import { findSlotForTime, generateTokenNumber, estimateConsultationTime } from "./token-allocator";
import { createWaitlistEntry } from "./waitlist-manager";
import { store } from "@/lib/store";

export interface EmergencyInsertResult {
  success: boolean;
  allocatedSlot?: { slotId: string; tokenNumber: string; estimatedTime: string };
  bumpedPatients: Array<{ patientId: string; newSlotId: string; tokenNumber: string }>;
  notifications: string[];
  message?: string;
}

/**
 * Find current or next available slot for doctor on given date.
 */
async function getCurrentOrNextSlot(doctorId: string, date: string): Promise<TimeSlot | undefined> {
  const allSlots = await store.slots.getByDoctorAndDate(doctorId, date);
  const slots = allSlots
    .filter((s) => s.status !== "cancelled" && s.status !== "completed")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const now = new Date();
  return slots.find((s) => new Date(s.endTime) > now) ?? slots[0];
}

/**
 * Get lowest-priority token in slot (for bumping). Tie-break by positionInQueue (later = lower).
 */
async function getLowestPriorityTokenInSlot(slotId: string): Promise<Token | null> {
  const tokens = await store.tokens.getBySlot(slotId);
  if (tokens.length === 0) return null;
  return tokens.sort((a, b) => {
    const prio = b.priority - a.priority; // higher priority number = lower priority
    if (prio !== 0) return prio;
    return b.positionInQueue - a.positionInQueue;
  })[0];
}

/**
 * Bump token to next available slot or waitlist.
 */
async function bumpTokenToNextSlot(token: Token): Promise<{
  newSlotId?: string;
  newTokenNumber?: string;
  onWaitlist: boolean;
}> {
  const slot = await store.slots.getById(token.slotId);
  if (!slot) return { onWaitlist: true };

  const date = slot.date;
  const allSlots = await store.slots.getByDoctorAndDate(token.doctorId, date);
  const slots = allSlots
    .filter((s) => s.status !== "cancelled" && s.id !== slot.id)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  for (const s of slots) {
    if (s.currentOccupancy < s.maxCapacity && new Date(s.endTime) > new Date()) {
      const tokensInSlot = await store.tokens.getBySlot(s.id);
      const positionInQueue = tokensInSlot.length + 1;
      const newTokenNumber = await generateTokenNumber(token.doctorId, s.id, positionInQueue);
      const estimatedTime = estimateConsultationTime(s, positionInQueue);

      const newToken: Token = {
        ...token,
        id: uuidv4(),
        tokenNumber: newTokenNumber,
        slotId: s.id,
        positionInQueue,
        estimatedConsultationTime: estimatedTime,
        allocatedAt: new Date().toISOString(),
      };
      await store.tokens.set(newToken);
      await store.slots.set({ ...s, currentOccupancy: s.currentOccupancy + 1 });
      return { newSlotId: s.id, newTokenNumber, onWaitlist: false };
    }
  }

  await createWaitlistEntry({
    id: uuidv4(),
    patientId: token.patientId,
    doctorId: token.doctorId,
    preferredSlotId: null,
    tokenSource: token.tokenSource,
  });
  return { onWaitlist: true };
}

/**
 * Insert emergency patient. Bump lowest-priority patient if slot full.
 */
export async function emergencyInsert(params: {
  patientId: string;
  doctorId: string;
  preferredSlot?: string;
}): Promise<EmergencyInsertResult> {
  const result: EmergencyInsertResult = {
    success: false,
    bumpedPatients: [],
    notifications: [],
  };

  const doctor = await store.doctors.getById(params.doctorId);
  if (!doctor) {
    result.message = "Invalid doctor";
    return result;
  }

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  let slot: TimeSlot | undefined;

  if (params.preferredSlot) {
    slot = await store.slots.getById(params.preferredSlot);
  }
  if (!slot) {
    slot = await getCurrentOrNextSlot(params.doctorId, date);
  }
  if (!slot) {
    result.message = "No available slot for this doctor today";
    return result;
  }

  const currentTokens = await store.tokens.getBySlot(slot.id);
  const hasCapacity = currentTokens.length < slot.maxCapacity;

  if (hasCapacity) {
    const positionInQueue = currentTokens.length + 1;
    const tokenNumber = await generateTokenNumber(params.doctorId, slot.id, positionInQueue);
    const estimatedTime = estimateConsultationTime(slot, positionInQueue);
    const token: Token = {
      id: uuidv4(),
      tokenNumber,
      patientId: params.patientId,
      doctorId: params.doctorId,
      slotId: slot.id,
      tokenSource: "follow_up",
      priority: EMERGENCY_PRIORITY,
      status: "allocated",
      allocatedAt: new Date().toISOString(),
      estimatedConsultationTime: estimatedTime,
      actualConsultationTime: null,
      completedAt: null,
      positionInQueue,
      isEmergency: true,
    };
    await store.tokens.set(token);
    await store.slots.set({ ...slot, currentOccupancy: slot.currentOccupancy + 1 });
    result.success = true;
    result.allocatedSlot = { slotId: slot.id, tokenNumber, estimatedTime };
    result.notifications.push(`Emergency patient ${params.patientId} allocated ${tokenNumber}`);
    return result;
  }

  const toBump = await getLowestPriorityTokenInSlot(slot.id);
  if (!toBump) {
    result.message = "Slot full and no token to bump";
    return result;
  }

  const bumpResult = await bumpTokenToNextSlot(toBump);
  await store.tokens.set({ ...toBump, status: "cancelled" });
  await store.slots.set({ ...slot, currentOccupancy: slot.currentOccupancy - 1 });

  const updatedTokens = await store.tokens.getBySlot(slot.id);
  const positionInQueue = updatedTokens.length + 1;
  const tokenNumber = await generateTokenNumber(params.doctorId, slot.id, positionInQueue);
  const estimatedTime = estimateConsultationTime(slot, positionInQueue);
  const token: Token = {
    id: uuidv4(),
    tokenNumber,
    patientId: params.patientId,
    doctorId: params.doctorId,
    slotId: slot.id,
    tokenSource: "follow_up",
    priority: EMERGENCY_PRIORITY,
    status: "allocated",
    allocatedAt: new Date().toISOString(),
    estimatedConsultationTime: estimatedTime,
    actualConsultationTime: null,
    completedAt: null,
    positionInQueue,
    isEmergency: true,
  };
  await store.tokens.set(token);
  await store.slots.set({ ...slot, currentOccupancy: slot.currentOccupancy + 1 });

  result.success = true;
  result.allocatedSlot = { slotId: slot.id, tokenNumber, estimatedTime };
  result.bumpedPatients.push({
    patientId: toBump.patientId,
    newSlotId: bumpResult.newSlotId ?? "waitlist",
    tokenNumber: bumpResult.newTokenNumber ?? "waitlist",
  });
  result.notifications.push(
    `Patient ${toBump.patientId} rescheduled to ${bumpResult.newSlotId ?? "waitlist"}`
  );
  result.notifications.push(`Emergency patient ${params.patientId} allocated ${tokenNumber}`);
  return result;
}
