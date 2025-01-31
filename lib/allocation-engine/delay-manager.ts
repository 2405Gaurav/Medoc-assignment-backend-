/**
 * Slot delay propagation: when doctor runs late, shift downstream slots and
 * recalculate estimated consultation times for affected tokens.
 */

import type { TimeSlot, Token } from "@/lib/types";
import { estimateConsultationTime } from "./token-allocator";
import { store } from "@/lib/store";

export interface DelayAdjustmentResult {
  affectedSlots: Array<{ slotId: string; newStartTime: string; delayMinutes: number }>;
  rescheduledPatients: Array<{ tokenId: string; patientId: string; newEstimatedTime: string }>;
  notificationsCount: number;
}

/**
 * Apply delay to a slot and cascade to all subsequent slots for that doctor on same day.
 */
export function adjustSlotTiming(
  slotId: string,
  delayMinutes: number,
  _reason?: string
): DelayAdjustmentResult {
  const slot = store.slots.getById(slotId);
  const result: DelayAdjustmentResult = {
    affectedSlots: [],
    rescheduledPatients: [],
    notificationsCount: 0,
  };

  if (!slot || delayMinutes <= 0) return result;

  const date = slot.date;
  const doctorId = slot.doctorId;
  const allSlots = store.slots
    .getByDoctorAndDate(doctorId, date)
    .filter((s) => s.status !== "cancelled" && s.status !== "completed")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const slotIndex = allSlots.findIndex((s) => s.id === slotId);
  if (slotIndex < 0) return result;

  const delayMs = delayMinutes * 60 * 1000;
  let cumulativeDelay = delayMinutes;

  for (let i = slotIndex; i < allSlots.length; i++) {
    const s = allSlots[i];
    const newStartTime =
      i === slotIndex && !s.actualStartTime
        ? new Date(new Date(s.startTime).getTime() + delayMs).toISOString()
        : new Date(new Date(s.startTime).getTime() + delayMs).toISOString();
    const updated: TimeSlot = {
      ...s,
      actualStartTime: i === slotIndex ? newStartTime : s.actualStartTime,
      estimatedDelay: cumulativeDelay,
      status: s.status === "scheduled" ? "delayed" : s.status,
    };
    store.slots.set(updated);
    result.affectedSlots.push({
      slotId: s.id,
      newStartTime: updated.actualStartTime ?? updated.startTime,
      delayMinutes: cumulativeDelay,
    });
    cumulativeDelay += 0;

    const tokensInSlot = store.tokens.getBySlot(s.id);
    for (const t of tokensInSlot) {
      const newEstimated = estimateConsultationTime(updated, t.positionInQueue);
      store.tokens.set({ ...t, estimatedConsultationTime: newEstimated });
      result.rescheduledPatients.push({
        tokenId: t.id,
        patientId: t.patientId,
        newEstimatedTime: newEstimated,
      });
      result.notificationsCount += 1;
    }
  }

  return result;
}
