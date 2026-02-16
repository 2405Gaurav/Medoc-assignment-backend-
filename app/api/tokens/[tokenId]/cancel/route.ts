import { NextRequest } from "next/server";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { store } from "@/lib/store";
import {
  reallocateFreedSlot,
  decrementSlotOccupancy,
} from "@/lib/allocation-engine";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;
    const token = await store.tokens.getById(tokenId);
    if (!token) {
      return errorResponse("Token not found", 404);
    }
    if (["cancelled", "no_show", "completed"].includes(token.status)) {
      return errorResponse(
        `Token cannot be cancelled (current status: ${token.status})`,
        409
      );
    }

    const slotId = token.slotId;
    await store.tokens.set({ ...token, status: "cancelled" });
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
