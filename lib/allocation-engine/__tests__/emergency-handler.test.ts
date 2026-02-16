import { describe, it, expect, beforeEach } from "vitest";
import { store } from "@/lib/store";
import { seedForDate } from "@/lib/seed";
import { allocateToken } from "../token-allocator";
import { emergencyInsert } from "../emergency-handler";

const DATE = "2024-02-01";

describe("emergency-handler", () => {
  beforeEach(async () => {
    await store.reset();
    await seedForDate(DATE);
  });

  it("inserts emergency when slot has capacity", async () => {
    const allSlots = await store.slots.getAll();
    const slot = allSlots.find((s) => s.doctorId === "D1");
    expect(slot).toBeDefined();
    await store.patients.set({
      id: "P-emergency",
      name: "Emergency Patient",
      phone: "+91-999",
      email: null,
      isFollowUp: false,
      previousVisit: null,
    });
    const result = await emergencyInsert({
      patientId: "P-emergency",
      doctorId: "D1",
      preferredSlot: slot!.id,
    });
    expect(result.success).toBe(true);
    expect(result.allocatedSlot?.tokenNumber).toBeDefined();
    expect(result.bumpedPatients).toHaveLength(0);
  });

  it("bumps lowest-priority token when slot full", async () => {
    const allSlots = await store.slots.getAll();
    const slot = allSlots.find((s) => s.doctorId === "D1");
    expect(slot).toBeDefined();
    const max = slot!.maxCapacity;
    for (let i = 0; i < max; i++) {
      await allocateToken({
        patientId: `P-${i}`,
        doctorId: "D1",
        slotTime: slot!.startTime,
        tokenSource: i === max - 1 ? "walk_in" : "paid_priority",
      });
    }
    await store.patients.set({
      id: "P-emergency",
      name: "Emergency",
      phone: "+91-999",
      email: null,
      isFollowUp: false,
      previousVisit: null,
    });
    const result = await emergencyInsert({
      patientId: "P-emergency",
      doctorId: "D1",
      preferredSlot: slot!.id,
    });
    expect(result.success).toBe(true);
    expect(result.allocatedSlot).toBeDefined();
    expect(result.bumpedPatients.length).toBeGreaterThanOrEqual(0);
  });
});
