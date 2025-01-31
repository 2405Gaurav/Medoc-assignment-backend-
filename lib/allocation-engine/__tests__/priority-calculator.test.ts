import { describe, it, expect } from "vitest";
import {
  getPriorityForSource,
  comparePriority,
  hasHigherPriority,
  EMERGENCY_PRIORITY,
} from "../priority-calculator";

describe("priority-calculator", () => {
  it("returns correct priority for all token sources", () => {
    expect(getPriorityForSource("paid_priority")).toBe(1);
    expect(getPriorityForSource("follow_up")).toBe(2);
    expect(getPriorityForSource("online_booking")).toBe(2);
    expect(getPriorityForSource("walk_in")).toBe(3);
  });

  it("EMERGENCY_PRIORITY is 0", () => {
    expect(EMERGENCY_PRIORITY).toBe(0);
  });

  it("comparePriority orders ascending (lower number first)", () => {
    expect(comparePriority(1, 2)).toBeLessThan(0);
    expect(comparePriority(2, 1)).toBeGreaterThan(0);
    expect(comparePriority(2, 2)).toBe(0);
  });

  it("hasHigherPriority: paid_priority > walk_in", () => {
    expect(hasHigherPriority("paid_priority", "walk_in")).toBe(true);
  });

  it("hasHigherPriority: walk_in not higher than paid_priority", () => {
    expect(hasHigherPriority("walk_in", "paid_priority")).toBe(false);
  });

  it("same priority: follow_up and online_booking are equal", () => {
    expect(getPriorityForSource("follow_up")).toBe(getPriorityForSource("online_booking"));
  });
});
