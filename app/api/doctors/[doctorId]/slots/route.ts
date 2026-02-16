import { NextRequest } from "next/server";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { store } from "@/lib/store";
import { ensureDoctorsAndSlotsForDate } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await params;
    const date =
      request.nextUrl.searchParams.get("date") ??
      new Date().toISOString().slice(0, 10);

    await ensureDoctorsAndSlotsForDate(date);

    const doctor = await store.doctors.getById(doctorId);
    if (!doctor) {
      return errorResponse("Doctor not found", 404);
    }

    const slotList = await store.slots.getByDoctorAndDate(doctorId, date);
    const slots = [];

    const sorted = slotList.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    for (const slot of sorted) {
      const tokensInSlot = await store.tokens.getBySlot(slot.id);
      const allWaitlist = await store.waitlist.getByDoctor(doctorId);
      const waitlistEntries = allWaitlist.filter(
        (w) => w.preferredSlotId === slot.id && w.status === "waiting"
      );
      slots.push({
        slotId: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxCapacity: slot.maxCapacity,
        currentOccupancy: slot.currentOccupancy,
        availableTokens: Math.max(0, slot.maxCapacity - slot.currentOccupancy),
        tokens: tokensInSlot.map((t) => ({
          id: t.id,
          tokenNumber: t.tokenNumber,
          patientId: t.patientId,
          tokenSource: t.tokenSource,
          priority: t.priority,
          status: t.status,
          positionInQueue: t.positionInQueue,
        })),
        waitlist: waitlistEntries.map((w) => ({
          id: w.id,
          patientId: w.patientId,
          tokenSource: w.tokenSource,
          priority: w.priority,
          joinedAt: w.joinedAt,
        })),
        status: slot.status,
      });
    }

    return jsonResponse({ slots });
  } catch (e) {
    console.error(e);
    return errorResponse("Internal server error", 500);
  }
}
