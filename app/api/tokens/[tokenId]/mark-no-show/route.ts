import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonResponse, errorResponse, handleZodError } from "@/lib/api-utils";
import { store } from "@/lib/store";
import {
  reallocateFreedSlot,
  decrementSlotOccupancy,
} from "@/lib/allocation-engine";

const BodySchema = z.object({
  gracePeriodExpired: z.boolean(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return handleZodError(parsed.error);
    }
    if (!parsed.data.gracePeriodExpired) {
      return errorResponse(
        "Cannot mark no-show until grace period has expired",
        400
      );
    }

    const token = await store.tokens.getById(tokenId);
    if (!token) {
      return errorResponse("Token not found", 404);
    }
    if (["cancelled", "no_show", "completed"].includes(token.status)) {
      return errorResponse(
        `Token cannot be marked no-show (current status: ${token.status})`,
        409
      );
    }

    const slotId = token.slotId;
    await store.tokens.set({ ...token, status: "no_show" });
    await decrementSlotOccupancy(slotId);
    const realloc = await reallocateFreedSlot(slotId);

    return jsonResponse({
      success: true,
      freedSlotId: slotId,
      reallocatedTo: realloc.reallocatedTo,
      waitlistPromotions: realloc.promotions,
    });
  } catch (e) {
    console.error(e);
    return errorResponse("Internal server error", 500);
  }
}
