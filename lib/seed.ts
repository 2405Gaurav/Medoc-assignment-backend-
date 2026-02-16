/**
 * Seed doctors and time slots for the OPD.
 * Call from API or simulation to bootstrap data.
 * Now async because the store uses Supabase.
 */

import { v4 as uuidv4 } from "uuid";
import type { Doctor, TimeSlot } from "@/lib/types";
import { store } from "@/lib/store";

const DOCTORS: Omit<Doctor, "id">[] = [
  {
    name: "Dr. Sharma",
    specialization: "General Medicine",
    slotDuration: 60,
    maxPatientsPerSlot: 10,
    workingHours: { start: "09:00", end: "13:00" },
  },
  {
    name: "Dr. Patel",
    specialization: "Cardiology",
    slotDuration: 60,
    maxPatientsPerSlot: 8,
    workingHours: { start: "10:00", end: "15:00" },
  },
  {
    name: "Dr. Singh",
    specialization: "Orthopedics",
    slotDuration: 60,
    maxPatientsPerSlot: 12,
    workingHours: { start: "09:00", end: "12:00" },
  },
];

function generateSlotsForDoctor(doctor: Doctor, date: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const start = new Date(`${date}T${doctor.workingHours.start}:00`);
  const end = new Date(`${date}T${doctor.workingHours.end}:00`);
  let current = new Date(start);
  while (current < end) {
    const slotEnd = new Date(current.getTime() + doctor.slotDuration * 60 * 1000);
    if (slotEnd > end) break;
    slots.push({
      id: uuidv4(),
      doctorId: doctor.id,
      date,
      startTime: current.toISOString(),
      endTime: slotEnd.toISOString(),
      maxCapacity: doctor.maxPatientsPerSlot,
      currentOccupancy: 0,
      status: "scheduled",
      actualStartTime: null,
      estimatedDelay: 0,
    });
    current = slotEnd;
  }
  return slots;
}

export async function seedDoctors(): Promise<Doctor[]> {
  const ids = ["D1", "D2", "D3"];
  const result: Doctor[] = [];
  for (let i = 0; i < DOCTORS.length; i++) {
    const doctor: Doctor = { ...DOCTORS[i], id: ids[i] };
    await store.doctors.set(doctor);
    result.push(doctor);
  }
  return result;
}

export async function seedSlotsForDate(date: string): Promise<TimeSlot[]> {
  const doctors = await store.doctors.getAll();
  const allSlots: TimeSlot[] = [];
  for (const doctor of doctors) {
    const slots = generateSlotsForDoctor(doctor, date);
    for (const s of slots) {
      await store.slots.set(s);
      allSlots.push(s);
    }
  }
  return allSlots;
}

export async function seedForDate(date: string): Promise<{ doctors: Doctor[]; slots: TimeSlot[] }> {
  await store.reset();
  const doctors = await seedDoctors();
  const slots = await seedSlotsForDate(date);
  return { doctors, slots };
}

/** Ensure doctors and slots exist for date without resetting store (no wipe of tokens/patients). */
export async function ensureDoctorsAndSlotsForDate(
  date: string
): Promise<{ doctors: Doctor[]; slots: TimeSlot[] }> {
  let doctors = await store.doctors.getAll();
  if (doctors.length === 0) {
    doctors = await seedDoctors();
  }
  const existingSlots = await store.slots.getByDoctorAndDate(doctors[0]!.id, date);
  if (existingSlots.length === 0) {
    return { doctors, slots: await seedSlotsForDate(date) };
  }
  const slots: TimeSlot[] = [];
  for (const d of doctors) {
    const doctorSlots = await store.slots.getByDoctorAndDate(d.id, date);
    slots.push(...doctorSlots);
  }
  return { doctors, slots };
}
