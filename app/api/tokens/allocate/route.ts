import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonResponse, errorResponse, handleZodError } from "@/lib/api-utils";
import { allocateToken } from "@/lib/allocation-engine";
import { ensureDoctorsAndSlotsForDate } from "@/lib/seed";
import { store } from "@/lib/store";

const TokenSourceEnum = z.enum([
  "online_booking",
  "walk_in",
  "paid_priority",
  "follow_up",
]);

const BodySchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  slotTime: z.string().min(1),
  tokenSource: TokenSourceEnum,
  patientDetails: z
    .object({
      name: z.string(),
      phone: z.string(),
      email: z.string().email().optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return handleZodError(parsed.error);
    }
    const { patientId, doctorId, slotTime, tokenSource, patientDetails } =
      parsed.data;

    const date = slotTime.slice(0, 10);
    const { slots } = ensureDoctorsAndSlotsForDate(date);
    if (slots.length === 0) {
      return errorResponse("No slots available for this date", 404);
    }

    if (!store.patients.getById(patientId) && patientDetails) {
      store.patients.set({
        id: patientId,
        name: patientDetails.name,
        phone: patientDetails.phone,
        email: patientDetails.email ?? null,
        isFollowUp: false,
        previousVisit: null,
      });
    }

    const result = allocateToken({
      patientId,
      doctorId,
      slotTime,
      tokenSource,
      patientDetails,
    });

    if (result.success && result.token) {
      return jsonResponse(
        {
          success: true,
          tokenNumber: result.token.tokenNumber,
          estimatedTime: result.token.estimatedConsultationTime,
          slotId: result.token.slotId,
          position: result.token.positionInQueue,
          message: result.message,
        },
        201
      );
    }

    return jsonResponse({
      success: false,
      message: result.message,
      waitlistPosition: result.waitlistPosition,
    });
  } catch (e) {
    console.error(e);
    return errorResponse("Internal server error", 500);
  }
}
