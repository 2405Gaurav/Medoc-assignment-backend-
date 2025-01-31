/**
 * Seed doctors and time slots for the OPD.
 * Call from API or simulation to bootstrap data.
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
  let seq = 0;
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
    seq++;
  }
  return slots;
}

export function seedDoctors(): Doctor[] {
  const ids = ["D1", "D2", "D3"];
  const result: Doctor[] = [];
  DOCTORS.forEach((d, i) => {
    const doctor: Doctor = { ...d, id: ids[i] };
    store.doctors.set(doctor);
    result.push(doctor);
  });
  return result;
}

export function seedSlotsForDate(date: string): TimeSlot[] {
  const doctors = store.doctors.getAll();
  const allSlots: TimeSlot[] = [];
  for (const doctor of doctors) {
    const slots = generateSlotsForDoctor(doctor, date);
    slots.forEach((s) => {
      store.slots.set(s);
      allSlots.push(s);
    });
  }
  return allSlots;
}

export function seedForDate(date: string): { doctors: Doctor[]; slots: TimeSlot[] } {
  store.reset();
  const doctors = seedDoctors();
  const slots = seedSlotsForDate(date);
  return { doctors, slots };
}

/** Ensure doctors and slots exist for date without resetting store (no wipe of tokens/patients). */
export function ensureDoctorsAndSlotsForDate(date: string): { doctors: Doctor[]; slots: TimeSlot[] } {
  let doctors = store.doctors.getAll();
  if (doctors.length === 0) {
    doctors = seedDoctors();
  }
  const existingSlots = store.slots.getByDoctorAndDate(doctors[0]!.id, date);
  if (existingSlots.length === 0) {
    return { doctors, slots: seedSlotsForDate(date) };
  }
  const slots = doctors.flatMap((d) => store.slots.getByDoctorAndDate(d.id, date));
  return { doctors, slots };
}
