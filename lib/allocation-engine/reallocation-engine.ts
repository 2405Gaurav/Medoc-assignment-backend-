/**
 * Dynamic token reallocation when slots are freed (cancellation, no-show).
 * Promotes highest-priority waitlist patient and allocates token for freed slot.
 */

import { v4 as uuidv4 } from "uuid";
import type { Token, TimeSlot } from "@/lib/types";
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
export function reallocateFreedSlot(slotId: string): ReallocationResult {
  const slot = store.slots.getById(slotId);
  const result: ReallocationResult = {
    freedSlotId: slotId,
    reallocatedTo: null,
    promotions: [],
  };

  if (!slot) return result;

  const doctorId = slot.doctorId;
  const next = getNextWaitlistPatient(doctorId, slotId);
  if (!next) {
    store.slots.set({
      ...slot,
      currentOccupancy: Math.max(0, slot.currentOccupancy - 1),
    });
    return result;
  }

  const currentTokensInSlot = store.tokens.getBySlot(slotId);
  const positionInQueue = currentTokensInSlot.length + 1;

  const tokenId = uuidv4();
  const tokenNumber = generateTokenNumber(doctorId, slotId, positionInQueue);
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

  store.tokens.set(newToken);
  markWaitlistPromoted(next.id);
  store.slots.set({
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
export function decrementSlotOccupancy(slotId: string): void {
  const slot = store.slots.getById(slotId);
  if (slot) {
    store.slots.set({
      ...slot,
      currentOccupancy: Math.max(0, slot.currentOccupancy - 1),
    });
  }
}
