/**
 * Dynamic token reallocation when slots are freed (cancellation, no-show).
 * Promotes highest-priority waitlist patient and allocates token for freed slot.
 * All methods are now async for Supabase store.
 */

import { v4 as uuidv4 } from "uuid";
import type { Token } from "@/lib/types";
import { getNextWaitlistPatient, markWaitlistPromoted } from "./waitlist-manager";
import { generateTokenNumber, estimateConsultationTime } from "./token-allocator";
import { store } from "@/lib/store";

export interface ReallocationResult {
  freedSlotId: string;
  reallocatedTo: string | null; // patientId
  promotedToken?: Token;
  promotions: Array<{ patientId: string; tokenNumber: string }>;
}

/**
 * When a token is cancelled or marked no-show, try to promote from waitlist.
 */
export async function reallocateFreedSlot(slotId: string): Promise<ReallocationResult> {
  const slot = await store.slots.getById(slotId);
  const result: ReallocationResult = {
    freedSlotId: slotId,
    reallocatedTo: null,
    promotions: [],
  };

  if (!slot) return result;

  const doctorId = slot.doctorId;
  const next = await getNextWaitlistPatient(doctorId, slotId);
  if (!next) {
    return result;
  }

  const currentTokensInSlot = await store.tokens.getBySlot(slotId);
  const positionInQueue = currentTokensInSlot.length + 1;

  const tokenId = uuidv4();
  const tokenNumber = await generateTokenNumber(doctorId, slotId, positionInQueue);
  const estimatedTime = estimateConsultationTime(slot, positionInQueue);

  const newToken: Token = {
    id: tokenId,
    tokenNumber,
    patientId: next.patientId,
    doctorId,
    slotId,
    tokenSource: next.tokenSource,
    priority: next.priority,
    status: "allocated",
    allocatedAt: new Date().toISOString(),
    estimatedConsultationTime: estimatedTime,
    actualConsultationTime: null,
    completedAt: null,
    positionInQueue,
  };

  await store.tokens.set(newToken);
  await markWaitlistPromoted(next.id);
  await store.slots.set({
    ...slot,
    currentOccupancy: slot.currentOccupancy + 1, // fill the freed spot
  });
  result.reallocatedTo = next.patientId;
  result.promotedToken = newToken;
  result.promotions.push({ patientId: next.patientId, tokenNumber });

  return result;
}

/**
 * Decrement slot occupancy when a token is removed (cancel/no-show).
 */
export async function decrementSlotOccupancy(slotId: string): Promise<void> {
  const slot = await store.slots.getById(slotId);
  if (slot) {
    await store.slots.set({
      ...slot,
      currentOccupancy: Math.max(0, slot.currentOccupancy - 1),
    });
  }
}
