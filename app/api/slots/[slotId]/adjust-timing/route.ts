import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonResponse, errorResponse, handleZodError } from "@/lib/api-utils";
import { store } from "@/lib/store";
import { adjustSlotTiming } from "@/lib/allocation-engine";

const BodySchema = z.object({
  delayMinutes: z.number().min(0),
  reason: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const { slotId } = await params;
    const slot = store.slots.getById(slotId);
    if (!slot) {
      return errorResponse("Slot not found", 404);
    }

    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const result = adjustSlotTiming(
      slotId,
      parsed.data.delayMinutes,
      parsed.data.reason
    );

    return jsonResponse({
      affectedSlots: result.affectedSlots,
      notificationsSent: result.notificationsCount,
      rescheduledPatients: result.rescheduledPatients,
    });
  } catch (e) {
    console.error(e);
    return errorResponse("Internal server error", 500);
  }
}
