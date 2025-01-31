import { describe, it, expect, beforeEach } from "vitest";
import { store } from "@/lib/store";
import { seedForDate } from "@/lib/seed";
import { allocateToken, findSlotForTime } from "@/lib/allocation-engine";

const DATE = "2024-02-01";

describe("token-allocator", () => {
  beforeEach(() => {
    store.reset();
    seedForDate(DATE);
  });

  it("allocates token when slot has capacity", () => {
    const slot = store.slots.getAll().find((s) => s.doctorId === "D1");
    expect(slot).toBeDefined();
    const r = allocateToken({
      patientId: "P1",
      doctorId: "D1",
      slotTime: slot!.startTime,
      tokenSource: "walk_in",
    });
    expect(r.success).toBe(true);
    expect(r.token).toBeDefined();
    expect(r.token!.tokenNumber).toMatch(/^D1-S\d+-T\d+$/);
    expect(r.token!.positionInQueue).toBe(1);
  });

  it("enforces slot capacity - adds to waitlist when full", () => {
    const slot = store.slots.getAll().find((s) => s.doctorId === "D1");
    expect(slot).toBeDefined();
    const max = slot!.maxCapacity;
    for (let i = 0; i < max; i++) {
      const r = allocateToken({
        patientId: `P-${i}`,
        doctorId: "D1",
        slotTime: slot!.startTime,
        tokenSource: "walk_in",
      });
      expect(r.success).toBe(true);
    }
    const next = allocateToken({
      patientId: "P-full",
      doctorId: "D1",
      slotTime: slot!.startTime,
      tokenSource: "walk_in",
    });
    expect(next.success).toBe(false);
    expect(next.waitlistPosition).toBeDefined();
    expect(next.waitlistPosition).toBeGreaterThanOrEqual(1);
  });

  it("rejects invalid doctor", () => {
    const slot = store.slots.getAll()[0];
    const r = allocateToken({
      patientId: "P1",
      doctorId: "INVALID",
      slotTime: slot!.startTime,
      tokenSource: "walk_in",
    });
    expect(r.success).toBe(false);
    expect(r.message).toContain("doctor");
  });

  it("rejects duplicate booking for same patient+doctor", () => {
    const slot = store.slots.getAll().find((s) => s.doctorId === "D1");
    allocateToken({
      patientId: "P-dup",
      doctorId: "D1",
      slotTime: slot!.startTime,
      tokenSource: "walk_in",
    });
    const r2 = allocateToken({
      patientId: "P-dup",
      doctorId: "D1",
      slotTime: slot!.startTime,
      tokenSource: "walk_in",
    });
    expect(r2.success).toBe(false);
    expect(r2.message).toContain("Duplicate");
  });
});
