import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonResponse, errorResponse, handleZodError } from "@/lib/api-utils";
import { emergencyInsert } from "@/lib/allocation-engine";
import { ensureDoctorsAndSlotsForDate } from "@/lib/seed";

const BodySchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  preferredSlot: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const date = new Date().toISOString().slice(0, 10);
    ensureDoctorsAndSlotsForDate(date);

    const result = emergencyInsert({
      patientId: parsed.data.patientId,
      doctorId: parsed.data.doctorId,
      preferredSlot: parsed.data.preferredSlot,
    });

    if (!result.success) {
      return errorResponse(result.message ?? "Emergency insert failed", 400);
    }

    return jsonResponse({
      allocatedSlot: result.allocatedSlot,
      bumpedPatients: result.bumpedPatients,
      notifications: result.notifications,
    });
  } catch (e) {
    console.error(e);
    return errorResponse("Internal server error", 500);
  }
}
