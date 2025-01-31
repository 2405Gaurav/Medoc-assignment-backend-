import { describe, it, expect, beforeEach } from "vitest";
import { store } from "@/lib/store";
import { seedForDate } from "@/lib/seed";
import { allocateToken } from "../token-allocator";
import { getSortedWaitlist } from "../waitlist-manager";
import { reallocateFreedSlot, decrementSlotOccupancy } from "../reallocation-engine";

const DATE = "2024-02-01";

describe("FIFO within same priority", () => {
  beforeEach(() => {
    store.reset();
    seedForDate(DATE);
  });

  it("promotes waitlist in FIFO order within same priority", () => {
    const slot = store.slots.getAll().find((s) => s.doctorId === "D1");
    expect(slot).toBeDefined();
    const max = slot!.maxCapacity;
    for (let i = 0; i < max; i++) {
      allocateToken({
        patientId: `P-filled-${i}`,
        doctorId: "D1",
        slotTime: slot!.startTime,
        tokenSource: "walk_in",
      });
    }
    allocateToken({
      patientId: "P-wait-1",
      doctorId: "D1",
      slotTime: slot!.startTime,
      tokenSource: "walk_in",
    });
    allocateToken({
      patientId: "P-wait-2",
      doctorId: "D1",
      slotTime: slot!.startTime,
      tokenSource: "walk_in",
    });

    const sorted = getSortedWaitlist("D1", slot!.id);
    expect(sorted.length).toBeGreaterThanOrEqual(2);
    expect(sorted[0]!.patientId).toBe("P-wait-1");
    expect(sorted[1]!.patientId).toBe("P-wait-2");

    const tokenToCancel = store.tokens.getBySlot(slot!.id)[0];
    store.tokens.set({ ...tokenToCancel!, status: "cancelled" });
    decrementSlotOccupancy(slot!.id);
    const realloc = reallocateFreedSlot(slot!.id);
    expect(realloc.reallocatedTo).toBe("P-wait-1");
  });
});
