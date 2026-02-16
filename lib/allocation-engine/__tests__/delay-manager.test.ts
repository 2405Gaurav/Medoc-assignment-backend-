import { describe, it, expect, beforeEach } from "vitest";
import { store } from "@/lib/store";
import { seedForDate } from "@/lib/seed";
import { allocateToken } from "../token-allocator";
import { adjustSlotTiming } from "../delay-manager";

const DATE = "2024-02-01";

describe("delay-manager", () => {
  beforeEach(async () => {
    await store.reset();
    await seedForDate(DATE);
  });

  it("propagates delay to subsequent slots and updates token estimated times", async () => {
    const slotsRaw = await store.slots.getByDoctorAndDate("D1", DATE);
    const slots = slotsRaw.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    expect(slots.length).toBeGreaterThanOrEqual(2);

    await allocateToken({
      patientId: "P1",
      doctorId: "D1",
      slotTime: slots[0]!.startTime,
      tokenSource: "walk_in",
    });
    await allocateToken({
      patientId: "P2",
      doctorId: "D1",
      slotTime: slots[1]!.startTime,
      tokenSource: "walk_in",
    });

    const firstSlotId = slots[0]!.id;
    const result = await adjustSlotTiming(firstSlotId, 20, "Doctor late");

    expect(result.affectedSlots.length).toBeGreaterThanOrEqual(1);
    expect(result.rescheduledPatients.length).toBeGreaterThanOrEqual(1);
    expect(result.notificationsCount).toBeGreaterThanOrEqual(1);

    const updatedSlot = await store.slots.getById(firstSlotId);
    expect(updatedSlot?.estimatedDelay).toBe(20);
  });
});
