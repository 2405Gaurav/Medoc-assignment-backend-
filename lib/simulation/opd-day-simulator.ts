/**
 * One-day OPD simulation with 3 doctors and realistic events.
 * Uses store and allocation engine directly (no HTTP) for deterministic runs.
 * All operations are now async for Supabase store.
 */

import { v4 as uuidv4 } from "uuid";
import { store } from "@/lib/store";
import { seedForDate } from "@/lib/seed";
import {
  allocateToken,
  reallocateFreedSlot,
  decrementSlotOccupancy,
  emergencyInsert,
  adjustSlotTiming,
} from "@/lib/allocation-engine";
import type { TokenSource, TimeSlot } from "@/lib/types";

const TOKEN_SOURCES: TokenSource[] = [
  "online_booking",
  "walk_in",
  "paid_priority",
  "follow_up",
];

export type Scenario = "normal_day" | "high_load" | "with_emergencies";

interface SimEvent {
  time: string;
  type: string;
  description: string;
  outcome?: string;
}

const eventsLog: SimEvent[] = [];

function log(time: string, type: string, description: string, outcome?: string) {
  eventsLog.push({ time, type, description, outcome });
  console.log(`[${time}] ${type}: ${description}${outcome ? ` -> ${outcome}` : ""}`);
}

/** Create or get patient */
async function ensurePatient(id: string, name: string): Promise<void> {
  const existing = await store.patients.getById(id);
  if (!existing) {
    await store.patients.set({
      id,
      name,
      phone: "+91-9876543210",
      email: `${id}@example.com`,
      isFollowUp: name.includes("Follow"),
      previousVisit: null,
    });
  }
}

/** Get slot at time for doctor */
async function getSlotAt(doctorId: string, date: string, timeStr: string) {
  const slots = await store.slots.getByDoctorAndDate(doctorId, date);
  const [h, m] = timeStr.split(":").map(Number);
  const target = new Date(date);
  target.setHours(h, m, 0, 0);
  return slots.find((s) => {
    const start = new Date(s.startTime);
    const end = new Date(s.endTime);
    return target >= start && target < end;
  });
}

export async function runSimulation(scenario: Scenario): Promise<{
  events: SimEvent[];
  totalAllocated: number;
  waitlistSize: number;
  completed: number;
  reallocations: number;
  slots: TimeSlot[];
}> {
  eventsLog.length = 0;
  const date = "2024-02-01";
  await seedForDate(date);
  const doctors = await store.doctors.getAll();
  let reallocations = 0;

  const d1 = doctors[0]!.id;
  const d2 = doctors[1]!.id;
  const d3 = doctors[2]!.id;

  // 50+ online bookings
  for (let i = 0; i < 52; i++) {
    const patientId = `P-online-${i}`;
    await ensurePatient(patientId, `Patient Online ${i}`);
    const doc = doctors[i % 3]!;
    const slot = await getSlotAt(doc.id, date, "09:00");
    if (slot) {
      const slotTime =
        i % 4 === 0
          ? slot.startTime
          : new Date(new Date(slot.startTime).getTime() + (i % 3) * 15 * 60 * 1000).toISOString();
      const r = await allocateToken({
        patientId,
        doctorId: doc.id,
        slotTime,
        tokenSource: "online_booking",
      });
      log(
        "09:00",
        "online_booking",
        `Patient ${patientId} -> ${doc.name}`,
        r.success ? `Token ${r.token?.tokenNumber}` : `Waitlist ${r.waitlistPosition}`
      );
    }
  }

  // Simultaneous arrival of 5 walk-ins at 9:05 AM (same doctor/slot)
  const slot9 = await getSlotAt(d1, date, "09:05");
  if (slot9) {
    for (let i = 0; i < 5; i++) {
      const patientId = `P-walkin-9:05-${i}`;
      await ensurePatient(patientId, `Walk-in 9:05 #${i}`);
      const r = await allocateToken({
        patientId,
        doctorId: d1,
        slotTime: slot9.startTime,
        tokenSource: "walk_in",
      });
      log(
        "09:05",
        "walk_in_simultaneous",
        `Patient ${patientId} -> Dr. Sharma (same slot)`,
        r.success ? `Token ${r.token?.tokenNumber}` : `Waitlist ${r.waitlistPosition ?? ""}`
      );
    }
  }

  // 20+ walk-ins throughout the day
  const walkInTimes = ["09:30", "10:00", "10:15", "10:45", "11:00", "11:20", "11:40", "12:00"];
  for (let i = 0; i < 18; i++) {
    const patientId = `P-walkin-${i}`;
    await ensurePatient(patientId, `Walk-in ${i}`);
    const doc = doctors[i % 3]!;
    const timeStr = walkInTimes[i % walkInTimes.length]!;
    const slot = await getSlotAt(doc.id, date, timeStr);
    if (slot) {
      const r = await allocateToken({
        patientId,
        doctorId: doc.id,
        slotTime: slot.startTime,
        tokenSource: "walk_in",
      });
      log(
        timeStr,
        "walk_in",
        `Patient ${patientId} -> ${doc.name}`,
        r.success ? `Token ${r.token?.tokenNumber}` : `Waitlist`
      );
    }
  }

  // 5+ paid priority
  for (let i = 0; i < 6; i++) {
    const patientId = `P-paid-${i}`;
    await ensurePatient(patientId, `Paid Priority ${i}`);
    const doc = doctors[i % 3]!;
    const slot = await getSlotAt(doc.id, date, i % 2 === 0 ? "10:00" : "11:00");
    if (slot) {
      const r = await allocateToken({
        patientId,
        doctorId: doc.id,
        slotTime: slot.startTime,
        tokenSource: "paid_priority",
      });
      log(
        "10:00",
        "paid_priority",
        `Patient ${patientId} -> ${doc.name}`,
        r.success ? `Token ${r.token?.tokenNumber}` : `Waitlist`
      );
    }
  }

  // 10+ follow-up
  for (let i = 0; i < 12; i++) {
    const patientId = `P-follow-${i}`;
    await ensurePatient(patientId, `Follow-up ${i}`);
    const doc = doctors[i % 3]!;
    const slot = await getSlotAt(doc.id, date, "09:30");
    if (slot) {
      const r = await allocateToken({
        patientId,
        doctorId: doc.id,
        slotTime: slot.startTime,
        tokenSource: "follow_up",
      });
      log(
        "09:30",
        "follow_up",
        `Patient ${patientId} -> ${doc.name}`,
        r.success ? `Token ${r.token?.tokenNumber}` : `Waitlist`
      );
    }
  }

  // 3 cancellations -> waitlist promotions
  const allTokens = (await store.tokens.getAll()).filter((t) => t.status === "allocated");
  for (let i = 0; i < 3 && i < allTokens.length; i++) {
    const t = allTokens[i]!;
    await store.tokens.set({ ...t, status: "cancelled" });
    await decrementSlotOccupancy(t.slotId);
    const realloc = await reallocateFreedSlot(t.slotId);
    reallocations += realloc.promotions.length;
    log(
      "10:30",
      "cancellation",
      `Token ${t.tokenNumber} cancelled`,
      realloc.reallocatedTo ? `Promoted ${realloc.reallocatedTo}` : "No promotion"
    );
  }

  // 2 no-shows
  const allocated = (await store.tokens.getAll()).filter((t) => t.status === "allocated");
  for (let i = 0; i < 2 && i < allocated.length; i++) {
    const t = allocated[i]!;
    await store.tokens.set({ ...t, status: "no_show" });
    await decrementSlotOccupancy(t.slotId);
    const realloc = await reallocateFreedSlot(t.slotId);
    reallocations += realloc.promotions.length;
    log(
      "11:00",
      "no_show",
      `Token ${t.tokenNumber} no-show`,
      realloc.reallocatedTo ? `Promoted ${realloc.reallocatedTo}` : "No promotion"
    );
  }

  if (scenario === "with_emergencies") {
    const d1Slots = await store.slots.getByDoctorAndDate(d1, date);
    const em = await emergencyInsert({
      patientId: "P-emergency-1",
      doctorId: d1,
      preferredSlot: d1Slots[0]?.id,
    });
    await ensurePatient("P-emergency-1", "Emergency Patient");
    log(
      "10:30",
      "emergency_insert",
      "Emergency patient -> Dr. Sharma",
      em.success ? `Slot ${em.allocatedSlot?.tokenNumber}, bumped: ${em.bumpedPatients.length}` : em.message
    );
  }

  // Last-minute online booking for already-started slot (slot has tokens, "active")
  const d1SlotsAll = await store.slots.getByDoctorAndDate(d1, date);
  const firstSlotD1 = d1SlotsAll.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )[0];
  if (firstSlotD1) {
    const tokensInFirst = await store.tokens.getBySlot(firstSlotD1.id);
    if (tokensInFirst.length > 0) {
      await ensurePatient("P-lastminute", "Last-minute Online");
      const r = await allocateToken({
        patientId: "P-lastminute",
        doctorId: d1,
        slotTime: firstSlotD1.startTime,
        tokenSource: "online_booking",
      });
      log(
        "10:00",
        "last_minute_booking",
        "Online booking for already-started slot (D1 first slot)",
        r.success ? `Token ${r.token?.tokenNumber}` : `Waitlist ${r.waitlistPosition ?? ""}`
      );
    }
  }

  // Dr. Sharma delayed 20 min at 10:30
  const sharmaSlots = (await store.slots.getByDoctorAndDate(d1, date)).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  const secondSlot = sharmaSlots[1];
  if (secondSlot) {
    const delayResult = await adjustSlotTiming(secondSlot.id, 20, "Doctor late");
    log(
      "10:30",
      "delay_propagation",
      "Dr. Sharma 20 min late",
      `Affected ${delayResult.affectedSlots.length} slots, ${delayResult.notificationsCount} notified`
    );
  }

  const allTokensFinal = await store.tokens.getAll();
  const totalAllocated = allTokensFinal.filter(
    (t) => !["cancelled", "no_show"].includes(t.status)
  ).length;
  const allWaitlist = await store.waitlist.getAll();
  const waitlistSize = allWaitlist.filter((w) => w.status === "waiting").length;
  const completed = allTokensFinal.filter((t) => t.status === "completed").length;

  return {
    events: [...eventsLog],
    totalAllocated,
    waitlistSize,
    completed,
    reallocations,
    slots: await store.slots.getAll(),
  };
}
