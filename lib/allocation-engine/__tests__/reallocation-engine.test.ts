import { describe, it, expect, beforeEach } from "vitest";
import { store } from "@/lib/store";
import { seedForDate } from "@/lib/seed";
import { allocateToken } from "../token-allocator";
import {
  reallocateFreedSlot,
  decrementSlotOccupancy,
} from "../reallocation-engine";

const DATE = "2024-02-01";

describe("reallocation-engine", () => {
  beforeEach(async () => {
    await store.reset();
    await seedForDate(DATE);
  });

  it("promotes waitlist patient on cancellation", async () => {
    const allSlots = await store.slots.getAll();
    const slot = allSlots.find((s) => s.doctorId === "D1");
    expect(slot).toBeDefined();
    const max = slot!.maxCapacity;
    for (let i = 0; i < max; i++) {
      await allocateToken({
        patientId: `P-${i}`,
        doctorId: "D1",
        slotTime: slot!.startTime,
        tokenSource: "walk_in",
      });
    }
    const waitlistResult = await allocateToken({
      patientId: "P-waitlist",
      doctorId: "D1",
      slotTime: slot!.startTime,
      tokenSource: "walk_in",
    });
    expect(waitlistResult.success).toBe(false);
    expect(waitlistResult.waitlistPosition).toBeGreaterThanOrEqual(1);

    const tokensInSlot = await store.tokens.getBySlot(slot!.id);
    const tokenToCancel = tokensInSlot[0];
    await store.tokens.set({ ...tokenToCancel!, status: "cancelled" });
    await decrementSlotOccupancy(slot!.id);
    const realloc = await reallocateFreedSlot(slot!.id);

    expect(realloc.reallocatedTo).toBe("P-waitlist");
    expect(realloc.promotions).toHaveLength(1);
    expect(realloc.promotions[0].patientId).toBe("P-waitlist");
    expect(realloc.promotedToken?.tokenNumber).toBeDefined();
  });

  it("decrements slot occupancy when no waitlist", async () => {
    const allSlots = await store.slots.getAll();
    const slot = allSlots.find((s) => s.doctorId === "D1");
    expect(slot).toBeDefined();
    await allocateToken({
      patientId: "P-only",
      doctorId: "D1",
      slotTime: slot!.startTime,
      tokenSource: "walk_in",
    });
    const tokensInSlot = await store.tokens.getBySlot(slot!.id);
    const token = tokensInSlot[0];
    await store.tokens.set({ ...token!, status: "cancelled" });
    await decrementSlotOccupancy(slot!.id);
    const realloc = await reallocateFreedSlot(slot!.id);
    expect(realloc.reallocatedTo).toBeNull();
    expect(realloc.promotions).toHaveLength(0);
    const updatedSlot = await store.slots.getById(slot!.id);
    expect(updatedSlot!.currentOccupancy).toBe(0);
  });
});
